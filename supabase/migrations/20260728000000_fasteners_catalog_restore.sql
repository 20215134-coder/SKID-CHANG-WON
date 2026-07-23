-- FSAE ERP: 체결류를 다시 독립 카탈로그(fasteners)로 되돌린다.
-- 20260726000015에서 Consumable Inventory로 통합했던 것을 원복한다.
-- 아직 운영 데이터가 없으므로, inventory_item_id를 참조하던 기존 assembly_fasteners 행은 정리한다
-- (원 통합 마이그레이션도 동일한 전제로 작성됨).
-- 재실행해도 안전하도록(idempotent) 작성함.

create table if not exists public.fasteners (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  spec text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_fasteners_updated_at on public.fasteners;
create trigger set_fasteners_updated_at
before update on public.fasteners
for each row
execute function public.set_updated_at();

alter table public.assembly_fasteners
  add column if not exists fastener_id uuid references public.fasteners (id) on delete restrict;

delete from public.assembly_fasteners where fastener_id is null;

alter table public.assembly_fasteners
  alter column fastener_id set not null;

alter table public.assembly_fasteners
  drop column if exists inventory_item_id;

alter table public.assembly_fasteners
  drop constraint if exists assembly_fasteners_assembly_id_inventory_item_id_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'assembly_fasteners_assembly_id_fastener_id_key'
  ) then
    alter table public.assembly_fasteners
      add constraint assembly_fasteners_assembly_id_fastener_id_key unique (assembly_id, fastener_id);
  end if;
end $$;

drop index if exists public.assembly_fasteners_inventory_item_id_idx;
create index if not exists assembly_fasteners_fastener_id_idx on public.assembly_fasteners (fastener_id);

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
