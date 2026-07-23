-- FSAE ERP: Design Journal 모듈. 설계/엔지니어링 히스토리를 게시판 형태로 기록한다.
-- subsystem/assembly는 기존 BOM 계층(subsystems/assemblies)을 그대로 참조한다(자유 텍스트가 아님).
-- 재실행해도 안전하도록(idempotent) 작성함.

create table if not exists public.design_journals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',
  author_id uuid not null references public.profiles (id) on delete restrict,
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  engineering_category public.bom_category not null,
  subsystem_id uuid references public.subsystems (id) on delete set null,
  assembly_id uuid references public.assemblies (id) on delete set null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists design_journals_vehicle_id_idx on public.design_journals (vehicle_id);
create index if not exists design_journals_engineering_category_idx on public.design_journals (engineering_category);
create index if not exists design_journals_author_id_idx on public.design_journals (author_id);
create index if not exists design_journals_created_at_idx on public.design_journals (created_at desc);
create index if not exists design_journals_tags_idx on public.design_journals using gin (tags);

drop trigger if exists set_design_journals_updated_at on public.design_journals;
create trigger set_design_journals_updated_at
before update on public.design_journals
for each row
execute function public.set_updated_at();

-- ── design_journal_files ──
create table if not exists public.design_journal_files (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.design_journals (id) on delete cascade,
  file_name text not null,
  file_type text not null,
  storage_path text not null,
  storage_provider text not null default 'supabase',
  file_size bigint not null,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists design_journal_files_journal_id_idx on public.design_journal_files (journal_id);

drop trigger if exists set_design_journal_files_updated_at on public.design_journal_files;
create trigger set_design_journal_files_updated_at
before update on public.design_journal_files
for each row
execute function public.set_updated_at();

-- ── 권한 helper: 이 게시글을 "편집"할 수 있는지 (작성자 본인 포함) ──
create or replace function public.can_edit_design_journal(p_journal_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.current_user_role() = 'admin'
    or public.current_user_is_team_leader()
    or exists (
      select 1 from public.design_journals dj
      where dj.id = p_journal_id
        and (
          dj.author_id = auth.uid()
          or (public.current_user_role() = 'leader' and dj.engineering_category = public.current_user_bom_category())
        )
    );
$$;

-- ── 권한 helper: 이 게시글을 "삭제"할 수 있는지 (작성자 본인은 제외, 관리자/팀장/담당 파트장만) ──
create or replace function public.can_delete_design_journal(p_journal_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.current_user_role() = 'admin'
    or public.current_user_is_team_leader()
    or exists (
      select 1 from public.design_journals dj
      where dj.id = p_journal_id
        and public.current_user_role() = 'leader'
        and dj.engineering_category = public.current_user_bom_category()
    );
$$;

-- ── RLS: design_journals ──
alter table public.design_journals enable row level security;

drop policy if exists "design_journals_select_active" on public.design_journals;
drop policy if exists "design_journals_insert_own" on public.design_journals;
drop policy if exists "design_journals_update_admin_or_team_leader" on public.design_journals;
drop policy if exists "design_journals_update_leader_own_category" on public.design_journals;
drop policy if exists "design_journals_update_own" on public.design_journals;
drop policy if exists "design_journals_delete_admin_or_team_leader" on public.design_journals;
drop policy if exists "design_journals_delete_leader_own_category" on public.design_journals;

create policy "design_journals_select_active"
on public.design_journals
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "design_journals_insert_own"
on public.design_journals
for insert
to authenticated
with check (public.current_user_status() = 'active' and author_id = auth.uid());

create policy "design_journals_update_admin_or_team_leader"
on public.design_journals
for update
to authenticated
using (public.current_user_role() = 'admin' or public.current_user_is_team_leader())
with check (public.current_user_role() = 'admin' or public.current_user_is_team_leader());

create policy "design_journals_update_leader_own_category"
on public.design_journals
for update
to authenticated
using (public.current_user_role() = 'leader' and engineering_category = public.current_user_bom_category())
with check (public.current_user_role() = 'leader' and engineering_category = public.current_user_bom_category());

create policy "design_journals_update_own"
on public.design_journals
for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "design_journals_delete_admin_or_team_leader"
on public.design_journals
for delete
to authenticated
using (public.current_user_role() = 'admin' or public.current_user_is_team_leader());

create policy "design_journals_delete_leader_own_category"
on public.design_journals
for delete
to authenticated
using (public.current_user_role() = 'leader' and engineering_category = public.current_user_bom_category());

-- ── RLS: design_journal_files (게시글을 편집할 수 있는 사람이 첨부파일도 관리) ──
alter table public.design_journal_files enable row level security;

drop policy if exists "design_journal_files_select_active" on public.design_journal_files;
drop policy if exists "design_journal_files_insert" on public.design_journal_files;
drop policy if exists "design_journal_files_delete" on public.design_journal_files;

create policy "design_journal_files_select_active"
on public.design_journal_files
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "design_journal_files_insert"
on public.design_journal_files
for insert
to authenticated
with check (public.can_edit_design_journal(journal_id));

create policy "design_journal_files_delete"
on public.design_journal_files
for delete
to authenticated
using (public.can_edit_design_journal(journal_id));

-- ── Storage: Design Journal 첨부파일 (private, 서명 URL로만 접근) ──
insert into storage.buckets (id, name, public)
values ('design-journal-files', 'design-journal-files', false)
on conflict (id) do nothing;

drop policy if exists "design_journal_files_storage_select" on storage.objects;
drop policy if exists "design_journal_files_storage_write" on storage.objects;
drop policy if exists "design_journal_files_storage_delete" on storage.objects;

create policy "design_journal_files_storage_select"
on storage.objects
for select
to authenticated
using (bucket_id = 'design-journal-files' and public.current_user_status() = 'active');

create policy "design_journal_files_storage_write"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'design-journal-files' and public.current_user_status() = 'active');

create policy "design_journal_files_storage_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'design-journal-files'
  and (public.current_user_role() = 'admin' or public.current_user_is_team_leader() or public.current_user_role() = 'leader')
);
