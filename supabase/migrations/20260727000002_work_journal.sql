-- FSAE ERP: Work Journal 모듈. 제작/조립 활동을 게시판 형태로 기록한다.
-- 참여자, 작업 시간, 소모품 사용(재고 차감)을 함께 관리한다.
-- 재실행해도 안전하도록(idempotent) 작성함.

create table if not exists public.work_journals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',
  author_id uuid not null references public.profiles (id) on delete restrict,
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  engineering_category public.bom_category not null,
  subsystem_id uuid references public.subsystems (id) on delete set null,
  assembly_id uuid references public.assemblies (id) on delete set null,
  work_start timestamptz not null,
  work_end timestamptz not null,
  total_work_time interval generated always as (work_end - work_start) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_journals_end_after_start check (work_end >= work_start)
);

create index if not exists work_journals_vehicle_id_idx on public.work_journals (vehicle_id);
create index if not exists work_journals_engineering_category_idx on public.work_journals (engineering_category);
create index if not exists work_journals_author_id_idx on public.work_journals (author_id);
create index if not exists work_journals_created_at_idx on public.work_journals (created_at desc);

drop trigger if exists set_work_journals_updated_at on public.work_journals;
create trigger set_work_journals_updated_at
before update on public.work_journals
for each row
execute function public.set_updated_at();

-- ── work_journal_participants ──
create table if not exists public.work_journal_participants (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.work_journals (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (journal_id, member_id)
);

create index if not exists work_journal_participants_journal_id_idx on public.work_journal_participants (journal_id);

drop trigger if exists set_work_journal_participants_updated_at on public.work_journal_participants;
create trigger set_work_journal_participants_updated_at
before update on public.work_journal_participants
for each row
execute function public.set_updated_at();

-- ── work_journal_files ──
create table if not exists public.work_journal_files (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.work_journals (id) on delete cascade,
  file_name text not null,
  file_type text not null,
  storage_path text not null,
  storage_provider text not null default 'supabase',
  file_size bigint not null,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists work_journal_files_journal_id_idx on public.work_journal_files (journal_id);

drop trigger if exists set_work_journal_files_updated_at on public.work_journal_files;
create trigger set_work_journal_files_updated_at
before update on public.work_journal_files
for each row
execute function public.set_updated_at();

-- ── work_journal_consumables ──
-- 실제 재고 차감/이동 이력 생성은 반드시 record_work_journal_consumables RPC(다음 마이그레이션)를 통해서만 이루어진다.
-- 클라이언트가 이 테이블에 직접 insert/update/delete할 수 없다 (inventory_movements와 동일한 append-only 원칙).
create table if not exists public.work_journal_consumables (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.work_journals (id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items (id) on delete restrict,
  quantity_used numeric not null check (quantity_used > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (journal_id, inventory_item_id)
);

create index if not exists work_journal_consumables_journal_id_idx on public.work_journal_consumables (journal_id);
create index if not exists work_journal_consumables_item_id_idx on public.work_journal_consumables (inventory_item_id);

-- ── 권한 helper: 이 게시글을 "편집"할 수 있는지 (작성자 본인 포함) ──
create or replace function public.can_edit_work_journal(p_journal_id uuid)
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
      select 1 from public.work_journals wj
      where wj.id = p_journal_id
        and (
          wj.author_id = auth.uid()
          or (public.current_user_role() = 'leader' and wj.engineering_category = public.current_user_bom_category())
        )
    );
$$;

-- ── 권한 helper: 이 게시글을 "삭제"할 수 있는지 (작성자 본인은 제외) ──
create or replace function public.can_delete_work_journal(p_journal_id uuid)
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
      select 1 from public.work_journals wj
      where wj.id = p_journal_id
        and public.current_user_role() = 'leader'
        and wj.engineering_category = public.current_user_bom_category()
    );
$$;

-- ── RLS: work_journals ──
alter table public.work_journals enable row level security;

drop policy if exists "work_journals_select_active" on public.work_journals;
drop policy if exists "work_journals_insert_own" on public.work_journals;
drop policy if exists "work_journals_update_admin_or_team_leader" on public.work_journals;
drop policy if exists "work_journals_update_leader_own_category" on public.work_journals;
drop policy if exists "work_journals_update_own" on public.work_journals;
drop policy if exists "work_journals_delete_admin_or_team_leader" on public.work_journals;
drop policy if exists "work_journals_delete_leader_own_category" on public.work_journals;

create policy "work_journals_select_active"
on public.work_journals
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "work_journals_insert_own"
on public.work_journals
for insert
to authenticated
with check (public.current_user_status() = 'active' and author_id = auth.uid());

create policy "work_journals_update_admin_or_team_leader"
on public.work_journals
for update
to authenticated
using (public.current_user_role() = 'admin' or public.current_user_is_team_leader())
with check (public.current_user_role() = 'admin' or public.current_user_is_team_leader());

create policy "work_journals_update_leader_own_category"
on public.work_journals
for update
to authenticated
using (public.current_user_role() = 'leader' and engineering_category = public.current_user_bom_category())
with check (public.current_user_role() = 'leader' and engineering_category = public.current_user_bom_category());

create policy "work_journals_update_own"
on public.work_journals
for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "work_journals_delete_admin_or_team_leader"
on public.work_journals
for delete
to authenticated
using (public.current_user_role() = 'admin' or public.current_user_is_team_leader());

create policy "work_journals_delete_leader_own_category"
on public.work_journals
for delete
to authenticated
using (public.current_user_role() = 'leader' and engineering_category = public.current_user_bom_category());

-- ── RLS: work_journal_participants ──
alter table public.work_journal_participants enable row level security;

drop policy if exists "work_journal_participants_select_active" on public.work_journal_participants;
drop policy if exists "work_journal_participants_insert" on public.work_journal_participants;
drop policy if exists "work_journal_participants_delete" on public.work_journal_participants;

create policy "work_journal_participants_select_active"
on public.work_journal_participants
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "work_journal_participants_insert"
on public.work_journal_participants
for insert
to authenticated
with check (public.can_edit_work_journal(journal_id));

create policy "work_journal_participants_delete"
on public.work_journal_participants
for delete
to authenticated
using (public.can_edit_work_journal(journal_id));

-- ── RLS: work_journal_files ──
alter table public.work_journal_files enable row level security;

drop policy if exists "work_journal_files_select_active" on public.work_journal_files;
drop policy if exists "work_journal_files_insert" on public.work_journal_files;
drop policy if exists "work_journal_files_delete" on public.work_journal_files;

create policy "work_journal_files_select_active"
on public.work_journal_files
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "work_journal_files_insert"
on public.work_journal_files
for insert
to authenticated
with check (public.can_edit_work_journal(journal_id));

create policy "work_journal_files_delete"
on public.work_journal_files
for delete
to authenticated
using (public.can_edit_work_journal(journal_id));

-- ── RLS: work_journal_consumables (select만 공개, insert/update/delete는 RPC 전용) ──
alter table public.work_journal_consumables enable row level security;

drop policy if exists "work_journal_consumables_select_active" on public.work_journal_consumables;

create policy "work_journal_consumables_select_active"
on public.work_journal_consumables
for select
to authenticated
using (public.current_user_status() = 'active');

-- ── Storage: Work Journal 첨부파일 (private, 서명 URL로만 접근) ──
insert into storage.buckets (id, name, public)
values ('work-journal-files', 'work-journal-files', false)
on conflict (id) do nothing;

drop policy if exists "work_journal_files_storage_select" on storage.objects;
drop policy if exists "work_journal_files_storage_write" on storage.objects;
drop policy if exists "work_journal_files_storage_delete" on storage.objects;

create policy "work_journal_files_storage_select"
on storage.objects
for select
to authenticated
using (bucket_id = 'work-journal-files' and public.current_user_status() = 'active');

create policy "work_journal_files_storage_write"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'work-journal-files' and public.current_user_status() = 'active');

create policy "work_journal_files_storage_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'work-journal-files'
  and (public.current_user_role() = 'admin' or public.current_user_is_team_leader() or public.current_user_role() = 'leader')
);
