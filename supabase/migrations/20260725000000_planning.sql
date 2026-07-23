-- FSAE ERP: Annual Planning & Task Management (Milestone).
-- 연간 계획(Annual Plan) -> 마일스톤(Milestone) -> 엔지니어링 카테고리 배정(milestone_assignments)
-- -> 진행 상태(task_progress) 흐름을 구현한다.
-- 재실행해도 안전하도록(idempotent) 작성함.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'annual_plan_status') then
    create type public.annual_plan_status as enum ('planning', 'active', 'completed', 'archived');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'milestone_priority') then
    create type public.milestone_priority as enum ('low', 'medium', 'high', 'critical');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type public.task_status as enum ('ready', 'in_progress', 'completed');
  end if;
end $$;

-- ── Team Leader: role 랭크와 별개인 boolean 플래그로 관리한다 (Treasurer와 동일한 패턴). ──
-- 여러 명이 동시에 Team Leader일 수 있으므로 Treasurer와 달리 "최대 1명" 제약은 두지 않는다.
alter table public.profiles
  add column if not exists is_team_leader boolean not null default false;

create or replace function public.current_user_is_team_leader()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_team_leader from public.profiles where id = auth.uid()), false);
$$;

-- ── annual_plans ──
create table if not exists public.annual_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  season integer not null unique,
  start_date date not null,
  end_date date not null,
  status public.annual_plan_status not null default 'planning',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_annual_plans_updated_at on public.annual_plans;
create trigger set_annual_plans_updated_at
before update on public.annual_plans
for each row
execute function public.set_updated_at();

-- ── milestones ──
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  annual_plan_id uuid not null references public.annual_plans (id) on delete cascade,
  title text not null,
  description text,
  start_date date not null,
  due_date date not null,
  priority public.milestone_priority not null default 'medium',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists milestones_annual_plan_id_idx on public.milestones (annual_plan_id);
create index if not exists milestones_due_date_idx on public.milestones (due_date);

drop trigger if exists set_milestones_updated_at on public.milestones;
create trigger set_milestones_updated_at
before update on public.milestones
for each row
execute function public.set_updated_at();

-- ── milestone_assignments: 마일스톤을 하나 이상의 엔지니어링 카테고리에 배정한다. ──
create table if not exists public.milestone_assignments (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  engineering_category public.bom_category not null,
  assigned_leader uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (milestone_id, engineering_category)
);

create index if not exists milestone_assignments_milestone_id_idx on public.milestone_assignments (milestone_id);
create index if not exists milestone_assignments_category_idx on public.milestone_assignments (engineering_category);

drop trigger if exists set_milestone_assignments_updated_at on public.milestone_assignments;
create trigger set_milestone_assignments_updated_at
before update on public.milestone_assignments
for each row
execute function public.set_updated_at();

-- 배정 시점에 해당 카테고리를 담당하는 현재 Leader를 자동으로 기록한다 (참고용 스냅샷, 권한 판단에는 쓰지 않음).
create or replace function public.set_milestone_assignment_leader()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assigned_leader is null then
    select id into new.assigned_leader
    from public.profiles
    where role = 'leader' and bom_category = new.engineering_category and status = 'active'
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists set_milestone_assignment_leader on public.milestone_assignments;
create trigger set_milestone_assignment_leader
before insert on public.milestone_assignments
for each row
execute function public.set_milestone_assignment_leader();

-- 배정이 생성되면 진행 상태 행을 기본값(ready)으로 자동 생성한다.
create or replace function public.create_task_progress_for_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.task_progress (milestone_assignment_id, status)
  values (new.id, 'ready');
  return new;
end;
$$;

drop trigger if exists create_task_progress_for_assignment on public.milestone_assignments;

-- ── task_progress: (마일스톤 × 카테고리) 배정 하나당 진행 상태 하나. ──
create table if not exists public.task_progress (
  id uuid primary key default gen_random_uuid(),
  milestone_assignment_id uuid not null unique references public.milestone_assignments (id) on delete cascade,
  status public.task_status not null default 'ready',
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_task_progress_updated_at on public.task_progress;
create trigger set_task_progress_updated_at
before update on public.task_progress
for each row
execute function public.set_updated_at();

create trigger create_task_progress_for_assignment
after insert on public.milestone_assignments
for each row
execute function public.create_task_progress_for_assignment();

-- ── RLS: annual_plans ──
alter table public.annual_plans enable row level security;

drop policy if exists "annual_plans_select_active" on public.annual_plans;
drop policy if exists "annual_plans_insert_admin_or_team_leader" on public.annual_plans;
drop policy if exists "annual_plans_update_admin_or_team_leader" on public.annual_plans;
drop policy if exists "annual_plans_delete_admin" on public.annual_plans;

create policy "annual_plans_select_active"
on public.annual_plans
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "annual_plans_insert_admin_or_team_leader"
on public.annual_plans
for insert
to authenticated
with check (public.current_user_role() = 'admin' or public.current_user_is_team_leader());

create policy "annual_plans_update_admin_or_team_leader"
on public.annual_plans
for update
to authenticated
using (public.current_user_role() = 'admin' or public.current_user_is_team_leader())
with check (public.current_user_role() = 'admin' or public.current_user_is_team_leader());

create policy "annual_plans_delete_admin"
on public.annual_plans
for delete
to authenticated
using (public.current_user_role() = 'admin');

-- ── RLS: milestones ──
alter table public.milestones enable row level security;

drop policy if exists "milestones_select_active" on public.milestones;
drop policy if exists "milestones_insert_admin_or_team_leader" on public.milestones;
drop policy if exists "milestones_update_admin_or_team_leader" on public.milestones;
drop policy if exists "milestones_delete_admin_or_team_leader" on public.milestones;

create policy "milestones_select_active"
on public.milestones
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "milestones_insert_admin_or_team_leader"
on public.milestones
for insert
to authenticated
with check (public.current_user_role() = 'admin' or public.current_user_is_team_leader());

create policy "milestones_update_admin_or_team_leader"
on public.milestones
for update
to authenticated
using (public.current_user_role() = 'admin' or public.current_user_is_team_leader())
with check (public.current_user_role() = 'admin' or public.current_user_is_team_leader());

create policy "milestones_delete_admin_or_team_leader"
on public.milestones
for delete
to authenticated
using (public.current_user_role() = 'admin' or public.current_user_is_team_leader());

-- ── RLS: milestone_assignments (생성/삭제는 Team Leader 소관 — 카테고리 배정) ──
alter table public.milestone_assignments enable row level security;

drop policy if exists "milestone_assignments_select_active" on public.milestone_assignments;
drop policy if exists "milestone_assignments_insert_admin_or_team_leader" on public.milestone_assignments;
drop policy if exists "milestone_assignments_delete_admin_or_team_leader" on public.milestone_assignments;

create policy "milestone_assignments_select_active"
on public.milestone_assignments
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "milestone_assignments_insert_admin_or_team_leader"
on public.milestone_assignments
for insert
to authenticated
with check (public.current_user_role() = 'admin' or public.current_user_is_team_leader());

create policy "milestone_assignments_delete_admin_or_team_leader"
on public.milestone_assignments
for delete
to authenticated
using (public.current_user_role() = 'admin' or public.current_user_is_team_leader());

-- ── RLS: task_progress (상태 변경은 Admin/Team Leader 또는 담당 카테고리 Part Leader만) ──
alter table public.task_progress enable row level security;

drop policy if exists "task_progress_select_active" on public.task_progress;
drop policy if exists "task_progress_update_admin_or_team_leader" on public.task_progress;
drop policy if exists "task_progress_update_part_leader_own_category" on public.task_progress;

create policy "task_progress_select_active"
on public.task_progress
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "task_progress_update_admin_or_team_leader"
on public.task_progress
for update
to authenticated
using (public.current_user_role() = 'admin' or public.current_user_is_team_leader())
with check (public.current_user_role() = 'admin' or public.current_user_is_team_leader());

create policy "task_progress_update_part_leader_own_category"
on public.task_progress
for update
to authenticated
using (
  public.current_user_role() = 'leader'
  and exists (
    select 1 from public.milestone_assignments ma
    where ma.id = milestone_assignment_id and ma.engineering_category = public.current_user_bom_category()
  )
)
with check (
  public.current_user_role() = 'leader'
  and exists (
    select 1 from public.milestone_assignments ma
    where ma.id = milestone_assignment_id and ma.engineering_category = public.current_user_bom_category()
  )
);
