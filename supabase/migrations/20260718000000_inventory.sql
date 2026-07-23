-- FSAE ERP: Inventory Management (실물 재고) — BOM(설계 정보)과 분리된 물리적 재고 관리.
-- 재실행해도 안전하도록(idempotent) 작성함.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'inventory_movement_type') then
    create type public.inventory_movement_type as enum ('in', 'out', 'adjustment');
  end if;
end $$;

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  bom_part_id uuid not null references public.bom_parts (id) on delete restrict,
  current_stock integer not null default 0 check (current_stock >= 0),
  minimum_stock integer not null default 0 check (minimum_stock >= 0),
  storage_location text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bom_part_id, storage_location)
);

drop trigger if exists set_inventory_updated_at on public.inventory;

create trigger set_inventory_updated_at
before update on public.inventory
for each row
execute function public.set_updated_at();

-- inventory_id는 재고 항목이 삭제되어도 NULL로 남기고, bom_part_id/storage_location을 스냅샷으로
-- 함께 저장해서 이력이 항상 "어떤 부품의 어느 위치" 기록인지 알 수 있게 한다. 이력은 절대 삭제하지 않는다.
create table if not exists public.inventory_history (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid references public.inventory (id) on delete set null,
  bom_part_id uuid not null references public.bom_parts (id) on delete restrict,
  storage_location text not null,
  movement_type public.inventory_movement_type not null,
  quantity integer not null,
  previous_stock integer not null,
  new_stock integer not null,
  reason text,
  performed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.inventory enable row level security;
alter table public.inventory_history enable row level security;

drop policy if exists "inventory_select_active" on public.inventory;
drop policy if exists "inventory_insert_admin" on public.inventory;
drop policy if exists "inventory_insert_leader_own_category" on public.inventory;
drop policy if exists "inventory_update_admin" on public.inventory;
drop policy if exists "inventory_update_leader_own_category" on public.inventory;
drop policy if exists "inventory_delete_admin" on public.inventory;

create policy "inventory_select_active"
on public.inventory
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "inventory_insert_admin"
on public.inventory
for insert
to authenticated
with check (public.current_user_role() = 'admin');

create policy "inventory_insert_leader_own_category"
on public.inventory
for insert
to authenticated
with check (
  public.current_user_role() = 'leader'
  and exists (
    select 1 from public.bom_parts bp
    where bp.id = bom_part_id and bp.category = public.current_user_bom_category()
  )
);

create policy "inventory_update_admin"
on public.inventory
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "inventory_update_leader_own_category"
on public.inventory
for update
to authenticated
using (
  public.current_user_role() = 'leader'
  and exists (
    select 1 from public.bom_parts bp
    where bp.id = bom_part_id and bp.category = public.current_user_bom_category()
  )
)
with check (
  public.current_user_role() = 'leader'
  and exists (
    select 1 from public.bom_parts bp
    where bp.id = bom_part_id and bp.category = public.current_user_bom_category()
  )
);

create policy "inventory_delete_admin"
on public.inventory
for delete
to authenticated
using (public.current_user_role() = 'admin');

drop policy if exists "inventory_history_select_active" on public.inventory_history;
drop policy if exists "inventory_history_insert_admin" on public.inventory_history;
drop policy if exists "inventory_history_insert_leader_own_category" on public.inventory_history;

create policy "inventory_history_select_active"
on public.inventory_history
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "inventory_history_insert_admin"
on public.inventory_history
for insert
to authenticated
with check (public.current_user_role() = 'admin');

create policy "inventory_history_insert_leader_own_category"
on public.inventory_history
for insert
to authenticated
with check (
  public.current_user_role() = 'leader'
  and exists (
    select 1 from public.bom_parts bp
    where bp.id = bom_part_id and bp.category = public.current_user_bom_category()
  )
);
-- update/delete 정책 없음: 이력은 절대 수정/삭제할 수 없다.

-- Stock In/Out/Adjustment을 "재고 갱신 + 이력 기록"이 하나의 트랜잭션으로 원자적으로 처리되도록
-- 하나의 함수로 묶는다. 권한 체크(Leader는 자기 카테고리만, Adjustment는 Admin만)도 이 안에서 수행한다.
create or replace function public.record_inventory_movement(
  p_inventory_id uuid,
  p_movement_type public.inventory_movement_type,
  p_quantity integer,
  p_reason text default null,
  p_new_stock integer default null
)
returns public.inventory_history
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inventory public.inventory;
  v_category public.bom_category;
  v_role public.user_role;
  v_previous_stock integer;
  v_new_stock integer;
  v_delta integer;
  v_history public.inventory_history;
begin
  select * into v_inventory from public.inventory where id = p_inventory_id for update;

  if not found then
    raise exception '재고 항목을 찾을 수 없습니다.';
  end if;

  select category into v_category from public.bom_parts where id = v_inventory.bom_part_id;
  v_role := public.current_user_role();

  if v_role = 'admin' then
    -- 전체 권한
  elsif v_role = 'leader' then
    if v_category is distinct from public.current_user_bom_category() then
      raise exception '담당 카테고리의 재고만 관리할 수 있습니다.';
    end if;
    if p_movement_type = 'adjustment' then
      raise exception 'Stock Adjustment은 관리자만 가능합니다.';
    end if;
  else
    raise exception '재고를 변경할 권한이 없습니다.';
  end if;

  v_previous_stock := v_inventory.current_stock;

  if p_movement_type = 'in' then
    if p_quantity is null or p_quantity <= 0 then
      raise exception '수량은 1 이상이어야 합니다.';
    end if;
    v_new_stock := v_previous_stock + p_quantity;
    v_delta := p_quantity;
  elsif p_movement_type = 'out' then
    if p_quantity is null or p_quantity <= 0 then
      raise exception '수량은 1 이상이어야 합니다.';
    end if;
    v_new_stock := v_previous_stock - p_quantity;
    v_delta := p_quantity;
  elsif p_movement_type = 'adjustment' then
    if p_new_stock is null then
      raise exception '조정할 재고 수량을 입력해주세요.';
    end if;
    v_new_stock := p_new_stock;
    v_delta := p_new_stock - v_previous_stock;
  else
    raise exception '알 수 없는 이동 유형입니다.';
  end if;

  if v_new_stock < 0 then
    raise exception '재고는 0 미만이 될 수 없습니다.';
  end if;

  update public.inventory
  set current_stock = v_new_stock
  where id = p_inventory_id;

  insert into public.inventory_history (
    inventory_id, bom_part_id, storage_location, movement_type, quantity, previous_stock, new_stock, reason, performed_by
  )
  values (
    v_inventory.id, v_inventory.bom_part_id, v_inventory.storage_location, p_movement_type,
    v_delta, v_previous_stock, v_new_stock, p_reason, auth.uid()
  )
  returning * into v_history;

  return v_history;
end;
$$;
