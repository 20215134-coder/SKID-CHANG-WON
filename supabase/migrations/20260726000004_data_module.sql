-- FSAE ERP: Data 모듈. 차량 제원/엔진 제원 등 팀 내부 엔지니어링 참조 데이터를 구조화된 key-value 스펙으로 저장한다.
-- 고급 분석 없이 단순 CRUD + 검색만 지원한다.
-- 재실행해도 안전하도록(idempotent) 작성함.

create table if not exists public.data_entries (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  description text,
  related_vehicle_id uuid references public.vehicles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists data_entries_category_idx on public.data_entries (category);

drop trigger if exists set_data_entries_updated_at on public.data_entries;
create trigger set_data_entries_updated_at
before update on public.data_entries
for each row
execute function public.set_updated_at();

create table if not exists public.data_entry_fields (
  id uuid primary key default gen_random_uuid(),
  data_entry_id uuid not null references public.data_entries (id) on delete cascade,
  field_name text not null,
  field_value text not null,
  unit text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists data_entry_fields_data_entry_id_idx on public.data_entry_fields (data_entry_id);

drop trigger if exists set_data_entry_fields_updated_at on public.data_entry_fields;
create trigger set_data_entry_fields_updated_at
before update on public.data_entry_fields
for each row
execute function public.set_updated_at();

-- ── RLS: Member 제외 누구나 생성/수정 가능, 삭제는 Admin만 (다른 모듈과 동일한 관례). ──
alter table public.data_entries enable row level security;
alter table public.data_entry_fields enable row level security;

drop policy if exists "data_entries_select_active" on public.data_entries;
drop policy if exists "data_entries_insert_not_member" on public.data_entries;
drop policy if exists "data_entries_update_not_member" on public.data_entries;
drop policy if exists "data_entries_delete_admin" on public.data_entries;

create policy "data_entries_select_active"
on public.data_entries
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "data_entries_insert_not_member"
on public.data_entries
for insert
to authenticated
with check (public.current_user_role() <> 'member');

create policy "data_entries_update_not_member"
on public.data_entries
for update
to authenticated
using (public.current_user_role() <> 'member')
with check (public.current_user_role() <> 'member');

create policy "data_entries_delete_admin"
on public.data_entries
for delete
to authenticated
using (public.current_user_role() = 'admin');

drop policy if exists "data_entry_fields_select_active" on public.data_entry_fields;
drop policy if exists "data_entry_fields_insert_not_member" on public.data_entry_fields;
drop policy if exists "data_entry_fields_update_not_member" on public.data_entry_fields;
drop policy if exists "data_entry_fields_delete_not_member" on public.data_entry_fields;

create policy "data_entry_fields_select_active"
on public.data_entry_fields
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "data_entry_fields_insert_not_member"
on public.data_entry_fields
for insert
to authenticated
with check (public.current_user_role() <> 'member');

create policy "data_entry_fields_update_not_member"
on public.data_entry_fields
for update
to authenticated
using (public.current_user_role() <> 'member')
with check (public.current_user_role() <> 'member');

create policy "data_entry_fields_delete_not_member"
on public.data_entry_fields
for delete
to authenticated
using (public.current_user_role() <> 'member');
