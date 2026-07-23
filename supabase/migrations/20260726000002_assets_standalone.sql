-- FSAE ERP: Assets를 Consumable Inventory와 완전히 독립된 모듈로 재구성한다.
-- 기존 assets(=inventory_items에 1:1로 종속)는 폐기하고, 자체 필드를 가진 독립 테이블로 다시 만든다.
-- 아직 프로덕션 데이터가 없으므로 기존 테스트 자산 데이터는 초기화한다.
-- 재실행해도 안전하도록(idempotent) 작성함.

drop table if exists public.assets cascade;

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  asset_number text not null unique,
  asset_name text not null,
  category text,
  description text,
  current_condition public.asset_condition not null default 'good',
  purchase_date date,
  purchase_cost numeric check (purchase_cost is null or purchase_cost >= 0),
  assigned_to uuid references public.profiles (id) on delete set null,
  notes text,
  source_purchase_request_id uuid references public.purchase_requests (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assets_category_idx on public.assets (category);

drop trigger if exists set_assets_updated_at on public.assets;
create trigger set_assets_updated_at
before update on public.assets
for each row
execute function public.set_updated_at();

-- ── RLS: assets (카테고리에 종속되지 않는 공용 팀 자산 — Admin/Leader 누구나 관리, Member는 읽기 전용) ──
alter table public.assets enable row level security;

drop policy if exists "assets_select_active" on public.assets;
drop policy if exists "assets_insert_admin_or_leader" on public.assets;
drop policy if exists "assets_update_admin_or_leader" on public.assets;
drop policy if exists "assets_delete_admin" on public.assets;

create policy "assets_select_active"
on public.assets
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "assets_insert_admin_or_leader"
on public.assets
for insert
to authenticated
with check (public.current_user_role() in ('admin', 'leader'));

create policy "assets_update_admin_or_leader"
on public.assets
for update
to authenticated
using (public.current_user_role() in ('admin', 'leader'))
with check (public.current_user_role() in ('admin', 'leader'));

create policy "assets_delete_admin"
on public.assets
for delete
to authenticated
using (public.current_user_role() = 'admin');
