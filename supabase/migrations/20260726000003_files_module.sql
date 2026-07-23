-- FSAE ERP: Files 모듈. General Documents(팀 공용 문서) + Vehicle Files(어셈블리 단위 엔지니어링 파일)를 관리한다.
-- 향후 Google Drive 연동을 대비해 external_url(nullable)을 함께 준비해 둔다 (지금은 실제 연동하지 않음).
-- 재실행해도 안전하도록(idempotent) 작성함.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'document_category') then
    create type public.document_category as enum ('rules', 'design_report', 'cost_report', 'ses', 'team_documents', 'other');
  end if;
end $$;

-- 기존 part_files에도 향후 Google Drive 연동을 위한 자리만 마련해 둔다.
alter table public.part_files
  add column if not exists external_url text;

-- ── assembly_files: 어셈블리 단위 엔지니어링 파일 (버전 관리 없이 단순 첨부 목록). ──
create table if not exists public.assembly_files (
  id uuid primary key default gen_random_uuid(),
  assembly_id uuid not null references public.assemblies (id) on delete cascade,
  file_name text not null,
  file_type text not null,
  storage_path text not null,
  file_size bigint not null,
  external_url text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assembly_files_assembly_id_idx on public.assembly_files (assembly_id);

drop trigger if exists set_assembly_files_updated_at on public.assembly_files;
create trigger set_assembly_files_updated_at
before update on public.assembly_files
for each row
execute function public.set_updated_at();

alter table public.assembly_files enable row level security;

drop policy if exists "assembly_files_select_active" on public.assembly_files;
drop policy if exists "assembly_files_insert_admin" on public.assembly_files;
drop policy if exists "assembly_files_insert_leader_own_category" on public.assembly_files;
drop policy if exists "assembly_files_delete_admin" on public.assembly_files;
drop policy if exists "assembly_files_delete_leader_own_category" on public.assembly_files;

create policy "assembly_files_select_active"
on public.assembly_files
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "assembly_files_insert_admin"
on public.assembly_files
for insert
to authenticated
with check (public.current_user_role() = 'admin');

create policy "assembly_files_insert_leader_own_category"
on public.assembly_files
for insert
to authenticated
with check (
  public.current_user_role() = 'leader'
  and public.assembly_category(assembly_id) = public.current_user_bom_category()
);

create policy "assembly_files_delete_admin"
on public.assembly_files
for delete
to authenticated
using (public.current_user_role() = 'admin');

create policy "assembly_files_delete_leader_own_category"
on public.assembly_files
for delete
to authenticated
using (
  public.current_user_role() = 'leader'
  and public.assembly_category(assembly_id) = public.current_user_bom_category()
);

-- ── general_documents: 팀 공용 문서 (Rules/Design Report/Cost Report/SES/Team Documents 등). ──
create table if not exists public.general_documents (
  id uuid primary key default gen_random_uuid(),
  category public.document_category not null default 'other',
  title text not null,
  description text,
  file_name text not null,
  file_type text not null,
  storage_path text not null,
  file_size bigint not null,
  external_url text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists general_documents_category_idx on public.general_documents (category);

drop trigger if exists set_general_documents_updated_at on public.general_documents;
create trigger set_general_documents_updated_at
before update on public.general_documents
for each row
execute function public.set_updated_at();

alter table public.general_documents enable row level security;

drop policy if exists "general_documents_select_active" on public.general_documents;
drop policy if exists "general_documents_insert_admin_or_leader" on public.general_documents;
drop policy if exists "general_documents_delete_admin" on public.general_documents;

create policy "general_documents_select_active"
on public.general_documents
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "general_documents_insert_admin_or_leader"
on public.general_documents
for insert
to authenticated
with check (public.current_user_role() in ('admin', 'leader'));

create policy "general_documents_delete_admin"
on public.general_documents
for delete
to authenticated
using (public.current_user_role() = 'admin');

-- ── Storage: 어셈블리 파일은 기존 bom-files 버킷을 재사용하고, 공용 문서는 새 버킷을 만든다. ──
insert into storage.buckets (id, name, public)
values ('general-documents', 'general-documents', false)
on conflict (id) do nothing;

drop policy if exists "general_documents_files_select_active" on storage.objects;
drop policy if exists "general_documents_files_write_admin_or_leader" on storage.objects;
drop policy if exists "general_documents_files_delete_admin" on storage.objects;

create policy "general_documents_files_select_active"
on storage.objects
for select
to authenticated
using (bucket_id = 'general-documents' and public.current_user_status() = 'active');

create policy "general_documents_files_write_admin_or_leader"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'general-documents'
  and public.current_user_role() in ('admin', 'leader')
);

create policy "general_documents_files_delete_admin"
on storage.objects
for delete
to authenticated
using (bucket_id = 'general-documents' and public.current_user_role() = 'admin');
