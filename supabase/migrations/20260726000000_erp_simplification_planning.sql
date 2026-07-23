-- FSAE ERP: 전면 단순화 - Planning 모듈을 "마일스톤만" 남기고 단순화한다.
-- milestone_assignments/task_progress(카테고리 배정+상태)는 새 Tasks 모듈(별도 마이그레이션)로 대체된다.
-- Calendar/Timeline은 더 이상 필요 없다 (Planning은 마일스톤 목록 + 대시보드만 유지).
-- 재실행해도 안전하도록(idempotent) 작성함.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'milestone_status') then
    create type public.milestone_status as enum ('planned', 'completed');
  end if;
end $$;

-- 기존 task_progress/milestone_assignments 관련 트리거 및 함수 정리.
drop trigger if exists create_task_progress_for_assignment on public.milestone_assignments;
drop trigger if exists set_milestone_assignment_leader on public.milestone_assignments;
drop function if exists public.create_task_progress_for_assignment();
drop function if exists public.set_milestone_assignment_leader();

drop table if exists public.task_progress cascade;
drop table if exists public.milestone_assignments cascade;

-- milestones: priority/start_date 제거, status 추가.
alter table public.milestones
  drop column if exists priority,
  drop column if exists start_date,
  add column if not exists status public.milestone_status not null default 'planned';

do $$
begin
  if exists (select 1 from pg_type where typname = 'milestone_priority') then
    drop type public.milestone_priority;
  end if;
end $$;
