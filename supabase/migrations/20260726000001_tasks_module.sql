-- FSAE ERP: Tasks 모듈. Part Leader가 마일스톤 아래에 직접 이름 붙인 실행 작업을 만들고 상태를 관리한다.
-- task_status enum(ready/in_progress/completed)은 기존 Planning 마이그레이션에서 만든 것을 재사용한다.
-- 재실행해도 안전하도록(idempotent) 작성함.

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  engineering_category public.bom_category not null,
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  task_name text not null,
  assignee_id uuid references public.profiles (id) on delete set null,
  status public.task_status not null default 'ready',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_milestone_id_idx on public.tasks (milestone_id);
create index if not exists tasks_category_idx on public.tasks (engineering_category);

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

alter table public.tasks enable row level security;

drop policy if exists "tasks_select_active" on public.tasks;
drop policy if exists "tasks_insert_admin_or_team_leader" on public.tasks;
drop policy if exists "tasks_insert_part_leader_own_category" on public.tasks;
drop policy if exists "tasks_update_admin_or_team_leader" on public.tasks;
drop policy if exists "tasks_update_part_leader_own_category" on public.tasks;
drop policy if exists "tasks_delete_admin_or_team_leader" on public.tasks;
drop policy if exists "tasks_delete_part_leader_own_category" on public.tasks;

create policy "tasks_select_active"
on public.tasks
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "tasks_insert_admin_or_team_leader"
on public.tasks
for insert
to authenticated
with check (public.current_user_role() = 'admin' or public.current_user_is_team_leader());

create policy "tasks_insert_part_leader_own_category"
on public.tasks
for insert
to authenticated
with check (
  public.current_user_role() = 'leader'
  and engineering_category = public.current_user_bom_category()
);

create policy "tasks_update_admin_or_team_leader"
on public.tasks
for update
to authenticated
using (public.current_user_role() = 'admin' or public.current_user_is_team_leader())
with check (public.current_user_role() = 'admin' or public.current_user_is_team_leader());

create policy "tasks_update_part_leader_own_category"
on public.tasks
for update
to authenticated
using (
  public.current_user_role() = 'leader'
  and engineering_category = public.current_user_bom_category()
)
with check (
  public.current_user_role() = 'leader'
  and engineering_category = public.current_user_bom_category()
);

create policy "tasks_delete_admin_or_team_leader"
on public.tasks
for delete
to authenticated
using (public.current_user_role() = 'admin' or public.current_user_is_team_leader());

create policy "tasks_delete_part_leader_own_category"
on public.tasks
for delete
to authenticated
using (
  public.current_user_role() = 'leader'
  and engineering_category = public.current_user_bom_category()
);
