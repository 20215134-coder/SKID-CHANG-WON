-- FSAE ERP: Budget Tree 요구사항의 "Member: Read only"를 반영해, 활성 사용자 누구나 예산을 조회할 수 있게 한다.
-- 수정 권한(Admin 전체 / Leader는 담당 카테고리만)은 기존 정책을 그대로 유지한다.
-- 재실행해도 안전하도록(idempotent) 작성함.

drop policy if exists "budgets_select" on public.budgets;
drop policy if exists "budgets_select_active" on public.budgets;

create policy "budgets_select_active"
on public.budgets
for select
to authenticated
using (public.current_user_status() = 'active');
