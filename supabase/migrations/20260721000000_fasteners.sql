-- FSAE ERP: 체결류(볼트/너트/와셔 등) 관리.
-- 가공품/기성품은 기존처럼 bom_parts(Part)로 관리하고, 체결류는 어셈블리별 수량과 함께 별도로 추적한다.
-- fasteners: 여러 어셈블리에서 재사용되는 공용 카탈로그. assembly_fasteners: 어셈블리별 사용 수량.
-- 재실행해도 안전하도록(idempotent) 작성함.

create table if not exists public.fasteners (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  spec text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assembly_fasteners (
  id uuid primary key default gen_random_uuid(),
  assembly_id uuid not null references public.assemblies (id) on delete cascade,
  fastener_id uuid not null references public.fasteners (id) on delete restrict,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assembly_id, fastener_id),
  constraint assembly_fasteners_quantity_positive check (quantity > 0)
);

create index if not exists assembly_fasteners_assembly_id_idx on public.assembly_fasteners (assembly_id);

drop trigger if exists set_fasteners_updated_at on public.fasteners;
create trigger set_fasteners_updated_at
before update on public.fasteners
for each row
execute function public.set_updated_at();

drop trigger if exists set_assembly_fasteners_updated_at on public.assembly_fasteners;
create trigger set_assembly_fasteners_updated_at
before update on public.assembly_fasteners
for each row
execute function public.set_updated_at();

-- ── RLS: fasteners (공용 카탈로그 — 특정 카테고리에 속하지 않음) ──
alter table public.fasteners enable row level security;

drop policy if exists "fasteners_select_active" on public.fasteners;
drop policy if exists "fasteners_insert_admin_or_leader" on public.fasteners;
drop policy if exists "fasteners_update_admin_or_leader" on public.fasteners;
drop policy if exists "fasteners_delete_admin" on public.fasteners;

create policy "fasteners_select_active"
on public.fasteners
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "fasteners_insert_admin_or_leader"
on public.fasteners
for insert
to authenticated
with check (public.current_user_role() in ('admin', 'leader'));

create policy "fasteners_update_admin_or_leader"
on public.fasteners
for update
to authenticated
using (public.current_user_role() in ('admin', 'leader'))
with check (public.current_user_role() in ('admin', 'leader'));

create policy "fasteners_delete_admin"
on public.fasteners
for delete
to authenticated
using (public.current_user_role() = 'admin');

-- ── RLS: assembly_fasteners (어셈블리 소속 카테고리 기준) ──
alter table public.assembly_fasteners enable row level security;

drop policy if exists "assembly_fasteners_select_active" on public.assembly_fasteners;
drop policy if exists "assembly_fasteners_insert_admin" on public.assembly_fasteners;
drop policy if exists "assembly_fasteners_insert_leader_own_category" on public.assembly_fasteners;
drop policy if exists "assembly_fasteners_update_admin" on public.assembly_fasteners;
drop policy if exists "assembly_fasteners_update_leader_own_category" on public.assembly_fasteners;
drop policy if exists "assembly_fasteners_delete_admin" on public.assembly_fasteners;
drop policy if exists "assembly_fasteners_delete_leader_own_category" on public.assembly_fasteners;

create policy "assembly_fasteners_select_active"
on public.assembly_fasteners
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "assembly_fasteners_insert_admin"
on public.assembly_fasteners
for insert
to authenticated
with check (public.current_user_role() = 'admin');

create policy "assembly_fasteners_insert_leader_own_category"
on public.assembly_fasteners
for insert
to authenticated
with check (
  public.current_user_role() = 'leader'
  and public.assembly_category(assembly_id) = public.current_user_bom_category()
);

create policy "assembly_fasteners_update_admin"
on public.assembly_fasteners
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "assembly_fasteners_update_leader_own_category"
on public.assembly_fasteners
for update
to authenticated
using (
  public.current_user_role() = 'leader'
  and public.assembly_category(assembly_id) = public.current_user_bom_category()
)
with check (
  public.current_user_role() = 'leader'
  and public.assembly_category(assembly_id) = public.current_user_bom_category()
);

create policy "assembly_fasteners_delete_admin"
on public.assembly_fasteners
for delete
to authenticated
using (public.current_user_role() = 'admin');

create policy "assembly_fasteners_delete_leader_own_category"
on public.assembly_fasteners
for delete
to authenticated
using (
  public.current_user_role() = 'leader'
  and public.assembly_category(assembly_id) = public.current_user_bom_category()
);
