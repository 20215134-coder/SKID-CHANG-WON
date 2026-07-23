-- FSAE ERP: 공지사항 모듈. 대시보드에 자리만 있고 실제 등록 기능이 없던 것을 추가한다.
-- 권한은 Planning 모듈과 동일한 관례(Admin 또는 Team Leader만 관리, 나머지는 읽기 전용)를 따른다.
-- 재실행해도 안전하도록(idempotent) 작성함.

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_created_at_idx on public.announcements (created_at desc);

drop trigger if exists set_announcements_updated_at on public.announcements;
create trigger set_announcements_updated_at
before update on public.announcements
for each row
execute function public.set_updated_at();

alter table public.announcements enable row level security;

drop policy if exists "announcements_select_active" on public.announcements;
drop policy if exists "announcements_insert_admin_or_team_leader" on public.announcements;
drop policy if exists "announcements_update_admin_or_team_leader" on public.announcements;
drop policy if exists "announcements_delete_admin_or_team_leader" on public.announcements;

create policy "announcements_select_active"
on public.announcements
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "announcements_insert_admin_or_team_leader"
on public.announcements
for insert
to authenticated
with check (public.current_user_role() = 'admin' or public.current_user_is_team_leader());

create policy "announcements_update_admin_or_team_leader"
on public.announcements
for update
to authenticated
using (public.current_user_role() = 'admin' or public.current_user_is_team_leader())
with check (public.current_user_role() = 'admin' or public.current_user_is_team_leader());

create policy "announcements_delete_admin_or_team_leader"
on public.announcements
for delete
to authenticated
using (public.current_user_role() = 'admin' or public.current_user_is_team_leader());
