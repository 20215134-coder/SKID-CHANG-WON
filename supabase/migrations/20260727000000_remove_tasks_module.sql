-- FSAE ERP: Tasks 모듈 제거. Design Journal / Work Journal로 대체된다.
-- Planning(annual_plans/milestones)은 그대로 유지하며, task_status enum은 tasks table에서만 쓰였으므로 함께 제거한다.
-- 재실행해도 안전하도록(idempotent) 작성함.

drop table if exists public.tasks cascade;
drop type if exists public.task_status;
