-- FSAE ERP: Inventory 모듈 전면 재설계.
-- BOM(설계)과 Inventory(실물 자산/재고)를 완전히 분리한다. BOM Part 연결은 선택 사항이다.
-- 기존 inventory / inventory_history / record_inventory_movement를 대체한다.
-- 재실행해도 안전하도록(idempotent) 작성함.

-- ── 기존 Inventory 구조 제거 ──
drop function if exists public.record_inventory_movement(uuid, public.inventory_movement_type, integer, text, integer);
drop table if exists public.inventory_history cascade;
drop table if exists public.inventory cascade;

do $$
begin
  if not exists (select 1 from pg_enum where enumlabel = 'transfer' and enumtypid = 'public.inventory_movement_type'::regtype) then
    alter type public.inventory_movement_type add value 'transfer';
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'inventory_item_status') then
    create type public.inventory_item_status as enum ('in_stock', 'low_stock', 'out_of_stock', 'discontinued');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'asset_condition') then
    create type public.asset_condition as enum ('excellent', 'good', 'fair', 'poor', 'out_of_service');
  end if;
end $$;

-- ── inventory_categories ──
create table if not exists public.inventory_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_inventory_categories_updated_at on public.inventory_categories;
create trigger set_inventory_categories_updated_at
before update on public.inventory_categories
for each row
execute function public.set_updated_at();

insert into public.inventory_categories (name)
values
  ('Raw Material'), ('Fasteners'), ('Purchased Parts'), ('Electrical Components'),
  ('Tools'), ('Measurement Equipment'), ('Manufacturing Equipment'), ('Safety Equipment'),
  ('Consumables'), ('Competition Equipment'), ('Team Assets'), ('Miscellaneous')
on conflict (name) do nothing;

-- ── inventory_items ──
-- owning_department: Part Leader가 "부서 공용 재고"를 관리할 수 있도록 하는 선택적 태그 (profiles.department와 매칭).
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  item_code text not null unique,
  item_name text not null,
  category_id uuid not null references public.inventory_categories (id) on delete restrict,
  manufacturer text,
  supplier text,
  description text,
  current_quantity numeric not null default 0 check (current_quantity >= 0),
  minimum_quantity numeric not null default 0 check (minimum_quantity >= 0),
  unit text not null default 'ea',
  storage_location text,
  unit_cost numeric check (unit_cost is null or unit_cost >= 0),
  total_asset_value numeric generated always as (current_quantity * coalesce(unit_cost, 0)) stored,
  status public.inventory_item_status not null default 'in_stock',
  related_part_id uuid references public.bom_parts (id) on delete set null,
  owning_department text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_items_category_id_idx on public.inventory_items (category_id);
create index if not exists inventory_items_status_idx on public.inventory_items (status);
create index if not exists inventory_items_related_part_id_idx on public.inventory_items (related_part_id);

drop trigger if exists set_inventory_items_updated_at on public.inventory_items;
create trigger set_inventory_items_updated_at
before update on public.inventory_items
for each row
execute function public.set_updated_at();

-- 생성 시점의 초기 상태는 수량 기준으로 자동 계산한다. 이후 상태 변경은 애플리케이션(수동 편집) 또는
-- record_inventory_movement RPC(수량 변경에 따른 자동 재계산, discontinued는 고정 유지)에서 처리한다.
create or replace function public.derive_inventory_item_initial_status()
returns trigger
language plpgsql
as $$
begin
  new.status := case
    when new.current_quantity <= 0 then 'out_of_stock'
    when new.current_quantity <= new.minimum_quantity then 'low_stock'
    else 'in_stock'
  end;
  return new;
end;
$$;

drop trigger if exists set_inventory_item_initial_status on public.inventory_items;
create trigger set_inventory_item_initial_status
before insert on public.inventory_items
for each row
execute function public.derive_inventory_item_initial_status();

-- ── inventory_movements (append-only, 절대 수정/삭제하지 않는다) ──
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items (id) on delete cascade,
  movement_type public.inventory_movement_type not null,
  quantity numeric not null,
  previous_quantity numeric not null,
  new_quantity numeric not null,
  reason text,
  performed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists inventory_movements_item_id_idx on public.inventory_movements (inventory_item_id);

-- ── assets (선택적 1:1 확장) ──
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null unique references public.inventory_items (id) on delete cascade,
  asset_number text not null unique,
  purchase_date date,
  purchase_cost numeric check (purchase_cost is null or purchase_cost >= 0),
  current_condition public.asset_condition not null default 'good',
  assigned_to uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_assets_updated_at on public.assets;
create trigger set_assets_updated_at
before update on public.assets
for each row
execute function public.set_updated_at();

-- ── 권한 helper ──
-- related_part_id가 속한 BOM 엔지니어링 카테고리를 조회한다 (BOM 연결이 없으면 null).
create or replace function public.inventory_item_bom_category(p_related_part_id uuid)
returns public.bom_category
language sql
security definer
set search_path = public
stable
as $$
  select public.assembly_category(bp.assembly_id)
  from public.bom_parts bp
  where bp.id = p_related_part_id;
$$;

create or replace function public.current_user_department()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select department from public.profiles where id = auth.uid();
$$;

-- ── RLS: inventory_categories (Admin만 생성/수정/삭제) ──
alter table public.inventory_categories enable row level security;

drop policy if exists "inventory_categories_select_active" on public.inventory_categories;
drop policy if exists "inventory_categories_insert_admin" on public.inventory_categories;
drop policy if exists "inventory_categories_update_admin" on public.inventory_categories;
drop policy if exists "inventory_categories_delete_admin" on public.inventory_categories;

create policy "inventory_categories_select_active"
on public.inventory_categories
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "inventory_categories_insert_admin"
on public.inventory_categories
for insert
to authenticated
with check (public.current_user_role() = 'admin');

create policy "inventory_categories_update_admin"
on public.inventory_categories
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "inventory_categories_delete_admin"
on public.inventory_categories
for delete
to authenticated
using (public.current_user_role() = 'admin');

-- ── RLS: inventory_items ──
alter table public.inventory_items enable row level security;

drop policy if exists "inventory_items_select_active" on public.inventory_items;
drop policy if exists "inventory_items_insert_admin" on public.inventory_items;
drop policy if exists "inventory_items_insert_leader" on public.inventory_items;
drop policy if exists "inventory_items_update_admin" on public.inventory_items;
drop policy if exists "inventory_items_update_leader" on public.inventory_items;
drop policy if exists "inventory_items_delete_admin" on public.inventory_items;

create policy "inventory_items_select_active"
on public.inventory_items
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "inventory_items_insert_admin"
on public.inventory_items
for insert
to authenticated
with check (public.current_user_role() = 'admin');

create policy "inventory_items_insert_leader"
on public.inventory_items
for insert
to authenticated
with check (
  public.current_user_role() = 'leader'
  and (
    public.inventory_item_bom_category(related_part_id) = public.current_user_bom_category()
    or (owning_department is not null and owning_department = public.current_user_department())
  )
);

create policy "inventory_items_update_admin"
on public.inventory_items
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "inventory_items_update_leader"
on public.inventory_items
for update
to authenticated
using (
  public.current_user_role() = 'leader'
  and (
    public.inventory_item_bom_category(related_part_id) = public.current_user_bom_category()
    or (owning_department is not null and owning_department = public.current_user_department())
  )
)
with check (
  public.current_user_role() = 'leader'
  and (
    public.inventory_item_bom_category(related_part_id) = public.current_user_bom_category()
    or (owning_department is not null and owning_department = public.current_user_department())
  )
);

create policy "inventory_items_delete_admin"
on public.inventory_items
for delete
to authenticated
using (public.current_user_role() = 'admin');

-- ── RLS: inventory_movements (select만 전체 공개, update/delete 정책 없음 = 영구 불변) ──
alter table public.inventory_movements enable row level security;

drop policy if exists "inventory_movements_select_active" on public.inventory_movements;
drop policy if exists "inventory_movements_insert_admin" on public.inventory_movements;
drop policy if exists "inventory_movements_insert_leader" on public.inventory_movements;

create policy "inventory_movements_select_active"
on public.inventory_movements
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "inventory_movements_insert_admin"
on public.inventory_movements
for insert
to authenticated
with check (public.current_user_role() = 'admin');

create policy "inventory_movements_insert_leader"
on public.inventory_movements
for insert
to authenticated
with check (
  public.current_user_role() = 'leader'
  and exists (
    select 1 from public.inventory_items ii
    where ii.id = inventory_item_id
      and (
        public.inventory_item_bom_category(ii.related_part_id) = public.current_user_bom_category()
        or (ii.owning_department is not null and ii.owning_department = public.current_user_department())
      )
  )
);

-- ── RLS: assets (관리 권한은 상위 inventory_items와 동일) ──
alter table public.assets enable row level security;

drop policy if exists "assets_select_active" on public.assets;
drop policy if exists "assets_insert_admin" on public.assets;
drop policy if exists "assets_insert_leader" on public.assets;
drop policy if exists "assets_update_admin" on public.assets;
drop policy if exists "assets_update_leader" on public.assets;
drop policy if exists "assets_delete_admin" on public.assets;

create policy "assets_select_active"
on public.assets
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "assets_insert_admin"
on public.assets
for insert
to authenticated
with check (public.current_user_role() = 'admin');

create policy "assets_insert_leader"
on public.assets
for insert
to authenticated
with check (
  public.current_user_role() = 'leader'
  and exists (
    select 1 from public.inventory_items ii
    where ii.id = inventory_item_id
      and (
        public.inventory_item_bom_category(ii.related_part_id) = public.current_user_bom_category()
        or (ii.owning_department is not null and ii.owning_department = public.current_user_department())
      )
  )
);

create policy "assets_update_admin"
on public.assets
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "assets_update_leader"
on public.assets
for update
to authenticated
using (
  public.current_user_role() = 'leader'
  and exists (
    select 1 from public.inventory_items ii
    where ii.id = inventory_item_id
      and (
        public.inventory_item_bom_category(ii.related_part_id) = public.current_user_bom_category()
        or (ii.owning_department is not null and ii.owning_department = public.current_user_department())
      )
  )
)
with check (
  public.current_user_role() = 'leader'
  and exists (
    select 1 from public.inventory_items ii
    where ii.id = inventory_item_id
      and (
        public.inventory_item_bom_category(ii.related_part_id) = public.current_user_bom_category()
        or (ii.owning_department is not null and ii.owning_department = public.current_user_department())
      )
  )
);

create policy "assets_delete_admin"
on public.assets
for delete
to authenticated
using (public.current_user_role() = 'admin');

-- ── record_inventory_movement: Stock In / Stock Out / Adjustment / Transfer를 원자적으로 처리한다. ──
create or replace function public.record_inventory_movement(
  p_item_id uuid,
  p_movement_type public.inventory_movement_type,
  p_quantity numeric default null,
  p_reason text default null,
  p_new_quantity numeric default null,
  p_new_location text default null
)
returns public.inventory_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.inventory_items;
  v_role public.user_role;
  v_can_manage boolean;
  v_previous_quantity numeric;
  v_new_quantity numeric;
  v_delta numeric;
  v_reason text;
  v_movement public.inventory_movements;
begin
  select * into v_item from public.inventory_items where id = p_item_id for update;
  if not found then
    raise exception '재고 항목을 찾을 수 없습니다.';
  end if;

  v_role := public.current_user_role();

  if v_role = 'admin' then
    v_can_manage := true;
  elsif v_role = 'leader' then
    v_can_manage := (
      public.inventory_item_bom_category(v_item.related_part_id) = public.current_user_bom_category()
      or (v_item.owning_department is not null and v_item.owning_department = public.current_user_department())
    );
  else
    v_can_manage := false;
  end if;

  if not v_can_manage then
    raise exception '이 재고 항목을 관리할 권한이 없습니다.';
  end if;

  if p_movement_type = 'adjustment' and v_role <> 'admin' then
    raise exception 'Adjustment는 관리자만 가능합니다.';
  end if;

  v_previous_quantity := v_item.current_quantity;
  v_reason := p_reason;

  if p_movement_type = 'in' then
    if p_quantity is null or p_quantity <= 0 then
      raise exception '수량은 0보다 커야 합니다.';
    end if;
    v_new_quantity := v_previous_quantity + p_quantity;
    v_delta := p_quantity;

  elsif p_movement_type = 'out' then
    if p_quantity is null or p_quantity <= 0 then
      raise exception '수량은 0보다 커야 합니다.';
    end if;
    v_new_quantity := v_previous_quantity - p_quantity;
    v_delta := p_quantity;

  elsif p_movement_type = 'adjustment' then
    if p_new_quantity is null then
      raise exception '조정할 수량을 입력해주세요.';
    end if;
    v_new_quantity := p_new_quantity;
    v_delta := p_new_quantity - v_previous_quantity;

  elsif p_movement_type = 'transfer' then
    if p_new_location is null or length(trim(p_new_location)) = 0 then
      raise exception '이동할 보관 위치를 입력해주세요.';
    end if;
    v_new_quantity := v_previous_quantity;
    v_delta := v_previous_quantity;
    v_reason := coalesce(p_reason, '')
      || case when p_reason is not null and length(trim(p_reason)) > 0 then ' · ' else '' end
      || '보관위치 변경: ' || coalesce(v_item.storage_location, '미지정') || ' → ' || p_new_location;

  else
    raise exception '알 수 없는 이동 유형입니다.';
  end if;

  if v_new_quantity < 0 then
    raise exception '재고는 0 미만이 될 수 없습니다.';
  end if;

  update public.inventory_items
  set
    current_quantity = v_new_quantity,
    storage_location = case when p_movement_type = 'transfer' then p_new_location else storage_location end,
    status = case
      when status = 'discontinued' then status
      when v_new_quantity <= 0 then 'out_of_stock'
      when v_new_quantity <= minimum_quantity then 'low_stock'
      else 'in_stock'
    end
  where id = p_item_id;

  insert into public.inventory_movements (
    inventory_item_id, movement_type, quantity, previous_quantity, new_quantity, reason, performed_by
  )
  values (
    p_item_id, p_movement_type, v_delta, v_previous_quantity, v_new_quantity, v_reason, auth.uid()
  )
  returning * into v_movement;

  return v_movement;
end;
$$;
