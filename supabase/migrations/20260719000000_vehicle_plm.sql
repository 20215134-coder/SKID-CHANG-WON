-- FSAE ERP: Vehicle PLM 구조 전면 개편.
-- Vehicle -> Engineering Category -> Subsystem -> Assembly -> Part 계층으로 전환한다.
-- 합의된 대로 기존 BOM/Inventory 테스트 데이터는 초기화한다.

truncate table public.inventory_history, public.inventory, public.bom_part_revisions, public.bom_parts cascade;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'vehicle_status') then
    create type public.vehicle_status as enum ('planning', 'active', 'archived');
  end if;
end $$;

-- CLAUDE.md 규칙: 모든 테이블은 id/created_at/updated_at을 포함한다.
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  vehicle_name text not null,
  competition_year integer not null,
  status public.vehicle_status not null default 'planning',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.engineering_categories (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  name public.bom_category not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vehicle_id, name)
);

create table if not exists public.subsystems (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.engineering_categories (id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, name)
);

create table if not exists public.assemblies (
  id uuid primary key default gen_random_uuid(),
  subsystem_id uuid not null references public.subsystems (id) on delete restrict,
  name text not null,
  description text,
  revision text not null default 'A',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subsystem_id, name)
);

drop trigger if exists set_vehicles_updated_at on public.vehicles;
create trigger set_vehicles_updated_at before update on public.vehicles for each row execute function public.set_updated_at();

drop trigger if exists set_engineering_categories_updated_at on public.engineering_categories;
create trigger set_engineering_categories_updated_at before update on public.engineering_categories for each row execute function public.set_updated_at();

drop trigger if exists set_subsystems_updated_at on public.subsystems;
create trigger set_subsystems_updated_at before update on public.subsystems for each row execute function public.set_updated_at();

drop trigger if exists set_assemblies_updated_at on public.assemblies;
create trigger set_assemblies_updated_at before update on public.assemblies for each row execute function public.set_updated_at();

-- 차량이 생성되면 4개 고정 엔지니어링 카테고리를 자동으로 만든다.
create or replace function public.create_default_engineering_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.engineering_categories (vehicle_id, name)
  values (new.id, 'chassis'), (new.id, 'powertrain'), (new.id, 'aero'), (new.id, 'electrical');
  return new;
end;
$$;

drop trigger if exists create_default_engineering_categories on public.vehicles;
create trigger create_default_engineering_categories
after insert on public.vehicles
for each row
execute function public.create_default_engineering_categories();

-- category 컬럼에 의존하는 기존 정책들을 먼저 지운다 (컬럼을 드롭하려면 선행되어야 함).
drop policy if exists "bom_parts_select_active" on public.bom_parts;
drop policy if exists "bom_parts_insert_admin" on public.bom_parts;
drop policy if exists "bom_parts_insert_leader_own_category" on public.bom_parts;
drop policy if exists "bom_parts_update_admin" on public.bom_parts;
drop policy if exists "bom_parts_update_leader_own_category" on public.bom_parts;
drop policy if exists "bom_parts_delete_admin" on public.bom_parts;
drop policy if exists "inventory_insert_leader_own_category" on public.inventory;
drop policy if exists "inventory_update_leader_own_category" on public.inventory;
drop policy if exists "inventory_history_insert_leader_own_category" on public.inventory_history;

-- bom_parts: category 컬럼을 없애고 assembly_id로 소속을 표현한다.
alter table public.bom_parts
  drop column if exists category,
  add column if not exists assembly_id uuid references public.assemblies (id) on delete restrict;

alter table public.bom_parts alter column assembly_id set not null;

alter table public.bom_part_revisions
  drop column if exists category,
  add column if not exists assembly_id uuid references public.assemblies (id) on delete restrict;

alter table public.bom_part_revisions alter column assembly_id set not null;

-- 계층을 타고 올라가 카테고리 이름을 알아내는 helper들 (RLS에서 사용).
create or replace function public.engineering_category_name(p_category_id uuid)
returns public.bom_category
language sql
security definer
set search_path = public
stable
as $$
  select name from public.engineering_categories where id = p_category_id;
$$;

create or replace function public.subsystem_category(p_subsystem_id uuid)
returns public.bom_category
language sql
security definer
set search_path = public
stable
as $$
  select public.engineering_category_name(category_id) from public.subsystems where id = p_subsystem_id;
$$;

create or replace function public.assembly_category(p_assembly_id uuid)
returns public.bom_category
language sql
security definer
set search_path = public
stable
as $$
  select public.subsystem_category(subsystem_id) from public.assemblies where id = p_assembly_id;
$$;

-- revision 스냅샷 트리거를 새 컬럼 구조에 맞게 갱신 (category 대신 assembly_id 기록).
create or replace function public.snapshot_bom_part_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.revision is distinct from old.revision then
    insert into public.bom_part_revisions (
      part_id, part_number, part_name, assembly_id, revision, material, weight,
      manufacturing_status, owner_id, supplier, cad_file_url, drawing_url, description, recorded_by
    )
    values (
      old.id, old.part_number, old.part_name, old.assembly_id, old.revision, old.material, old.weight,
      old.manufacturing_status, old.owner_id, old.supplier, old.cad_file_url, old.drawing_url, old.description,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

-- ── RLS: vehicles ──────────────────────────────────────────────
alter table public.vehicles enable row level security;

drop policy if exists "vehicles_select_active" on public.vehicles;
drop policy if exists "vehicles_insert_admin" on public.vehicles;
drop policy if exists "vehicles_update_admin" on public.vehicles;

create policy "vehicles_select_active" on public.vehicles for select to authenticated
using (public.current_user_status() = 'active');

create policy "vehicles_insert_admin" on public.vehicles for insert to authenticated
with check (public.current_user_role() = 'admin');

create policy "vehicles_update_admin" on public.vehicles for update to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

-- ── RLS: engineering_categories (client insert/update 없음 — 차량 생성 트리거로만 생성) ──
alter table public.engineering_categories enable row level security;

drop policy if exists "engineering_categories_select_active" on public.engineering_categories;

create policy "engineering_categories_select_active" on public.engineering_categories for select to authenticated
using (public.current_user_status() = 'active');

-- ── RLS: subsystems ────────────────────────────────────────────
alter table public.subsystems enable row level security;

drop policy if exists "subsystems_select_active" on public.subsystems;
drop policy if exists "subsystems_insert_admin" on public.subsystems;
drop policy if exists "subsystems_insert_leader_own_category" on public.subsystems;
drop policy if exists "subsystems_update_admin" on public.subsystems;
drop policy if exists "subsystems_update_leader_own_category" on public.subsystems;

create policy "subsystems_select_active" on public.subsystems for select to authenticated
using (public.current_user_status() = 'active');

create policy "subsystems_insert_admin" on public.subsystems for insert to authenticated
with check (public.current_user_role() = 'admin');

create policy "subsystems_insert_leader_own_category" on public.subsystems for insert to authenticated
with check (
  public.current_user_role() = 'leader'
  and public.engineering_category_name(category_id) = public.current_user_bom_category()
);

create policy "subsystems_update_admin" on public.subsystems for update to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "subsystems_update_leader_own_category" on public.subsystems for update to authenticated
using (
  public.current_user_role() = 'leader'
  and public.engineering_category_name(category_id) = public.current_user_bom_category()
)
with check (
  public.current_user_role() = 'leader'
  and public.engineering_category_name(category_id) = public.current_user_bom_category()
);

-- ── RLS: assemblies ────────────────────────────────────────────
alter table public.assemblies enable row level security;

drop policy if exists "assemblies_select_active" on public.assemblies;
drop policy if exists "assemblies_insert_admin" on public.assemblies;
drop policy if exists "assemblies_insert_leader_own_category" on public.assemblies;
drop policy if exists "assemblies_update_admin" on public.assemblies;
drop policy if exists "assemblies_update_leader_own_category" on public.assemblies;

create policy "assemblies_select_active" on public.assemblies for select to authenticated
using (public.current_user_status() = 'active');

create policy "assemblies_insert_admin" on public.assemblies for insert to authenticated
with check (public.current_user_role() = 'admin');

create policy "assemblies_insert_leader_own_category" on public.assemblies for insert to authenticated
with check (
  public.current_user_role() = 'leader'
  and public.subsystem_category(subsystem_id) = public.current_user_bom_category()
);

create policy "assemblies_update_admin" on public.assemblies for update to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "assemblies_update_leader_own_category" on public.assemblies for update to authenticated
using (
  public.current_user_role() = 'leader'
  and public.subsystem_category(subsystem_id) = public.current_user_bom_category()
)
with check (
  public.current_user_role() = 'leader'
  and public.subsystem_category(subsystem_id) = public.current_user_bom_category()
);

-- ── RLS: bom_parts (category 기반 -> assembly 체인 기반으로 재작성) ──
drop policy if exists "bom_parts_select_active" on public.bom_parts;
drop policy if exists "bom_parts_insert_admin" on public.bom_parts;
drop policy if exists "bom_parts_insert_leader_own_category" on public.bom_parts;
drop policy if exists "bom_parts_update_admin" on public.bom_parts;
drop policy if exists "bom_parts_update_leader_own_category" on public.bom_parts;
drop policy if exists "bom_parts_delete_admin" on public.bom_parts;

create policy "bom_parts_select_active" on public.bom_parts for select to authenticated
using (public.current_user_status() = 'active');

create policy "bom_parts_insert_admin" on public.bom_parts for insert to authenticated
with check (public.current_user_role() = 'admin');

create policy "bom_parts_insert_leader_own_category" on public.bom_parts for insert to authenticated
with check (
  public.current_user_role() = 'leader'
  and public.assembly_category(assembly_id) = public.current_user_bom_category()
);

create policy "bom_parts_update_admin" on public.bom_parts for update to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "bom_parts_update_leader_own_category" on public.bom_parts for update to authenticated
using (
  public.current_user_role() = 'leader'
  and public.assembly_category(assembly_id) = public.current_user_bom_category()
)
with check (
  public.current_user_role() = 'leader'
  and public.assembly_category(assembly_id) = public.current_user_bom_category()
);

create policy "bom_parts_delete_admin" on public.bom_parts for delete to authenticated
using (public.current_user_role() = 'admin');

-- ── RLS: inventory / inventory_history (bom_parts.category -> assembly_category(bom_parts.assembly_id)) ──
drop policy if exists "inventory_insert_leader_own_category" on public.inventory;
drop policy if exists "inventory_update_leader_own_category" on public.inventory;

create policy "inventory_insert_leader_own_category" on public.inventory for insert to authenticated
with check (
  public.current_user_role() = 'leader'
  and exists (
    select 1 from public.bom_parts bp
    where bp.id = bom_part_id and public.assembly_category(bp.assembly_id) = public.current_user_bom_category()
  )
);

create policy "inventory_update_leader_own_category" on public.inventory for update to authenticated
using (
  public.current_user_role() = 'leader'
  and exists (
    select 1 from public.bom_parts bp
    where bp.id = bom_part_id and public.assembly_category(bp.assembly_id) = public.current_user_bom_category()
  )
)
with check (
  public.current_user_role() = 'leader'
  and exists (
    select 1 from public.bom_parts bp
    where bp.id = bom_part_id and public.assembly_category(bp.assembly_id) = public.current_user_bom_category()
  )
);

drop policy if exists "inventory_history_insert_leader_own_category" on public.inventory_history;

create policy "inventory_history_insert_leader_own_category" on public.inventory_history for insert to authenticated
with check (
  public.current_user_role() = 'leader'
  and exists (
    select 1 from public.bom_parts bp
    where bp.id = bom_part_id and public.assembly_category(bp.assembly_id) = public.current_user_bom_category()
  )
);

-- record_inventory_movement()이 category 컬럼 대신 assembly 체인으로 카테고리를 조회하도록 갱신.
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

  select public.assembly_category(bp.assembly_id) into v_category
  from public.bom_parts bp
  where bp.id = v_inventory.bom_part_id;

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
