-- FSAE ERP: Data 항목에 파일 첨부 기능을 추가한다. 제목/설명(간단한 내용)은 이미 있으니
-- 파일 첨부만 새로 지원하면 "제목 + 간단한 내용 + 파일"을 게시판처럼 올릴 수 있다.
-- 재실행해도 안전하도록(idempotent) 작성함.

create table if not exists public.data_entry_files (
  id uuid primary key default gen_random_uuid(),
  data_entry_id uuid not null references public.data_entries (id) on delete cascade,
  file_name text not null,
  file_type text not null,
  storage_path text not null,
  file_size bigint not null,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists data_entry_files_data_entry_id_idx on public.data_entry_files (data_entry_id);

drop trigger if exists set_data_entry_files_updated_at on public.data_entry_files;
create trigger set_data_entry_files_updated_at
before update on public.data_entry_files
for each row
execute function public.set_updated_at();

-- ── RLS: data_entries와 동일한 관례 (Member 제외 누구나 생성/삭제 가능) ──
alter table public.data_entry_files enable row level security;

drop policy if exists "data_entry_files_select_active" on public.data_entry_files;
drop policy if exists "data_entry_files_insert_not_member" on public.data_entry_files;
drop policy if exists "data_entry_files_delete_not_member" on public.data_entry_files;

create policy "data_entry_files_select_active"
on public.data_entry_files
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "data_entry_files_insert_not_member"
on public.data_entry_files
for insert
to authenticated
with check (public.current_user_role() <> 'member');

create policy "data_entry_files_delete_not_member"
on public.data_entry_files
for delete
to authenticated
using (public.current_user_role() <> 'member');

-- ── Storage: Data 첨부파일 (private, 서명 URL로만 접근) ──
insert into storage.buckets (id, name, public)
values ('data-entry-files', 'data-entry-files', false)
on conflict (id) do nothing;

drop policy if exists "data_entry_files_storage_select" on storage.objects;
drop policy if exists "data_entry_files_storage_write" on storage.objects;
drop policy if exists "data_entry_files_storage_delete" on storage.objects;

create policy "data_entry_files_storage_select"
on storage.objects
for select
to authenticated
using (bucket_id = 'data-entry-files' and public.current_user_status() = 'active');

create policy "data_entry_files_storage_write"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'data-entry-files' and public.current_user_role() <> 'member');

create policy "data_entry_files_storage_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'data-entry-files' and public.current_user_role() <> 'member');
