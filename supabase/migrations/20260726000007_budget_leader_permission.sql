-- FSAE ERP: 리더가 자신의 담당 카테고리 예산은 직접 배정할 수 있게 한다.
-- 차량 전체 예산(category_id is null)은 여전히 Admin만 수정 가능하다.
-- 재실행해도 안전하도록(idempotent) 작성함.

drop policy if exists "budgets_update_admin_or_leader_own_category" on public.budgets;
drop policy if exists "budgets_update_admin" on public.budgets;

create policy "budgets_update_admin_or_leader_own_category"
on public.budgets
for update
to authenticated
using (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'leader'
    and category_id is not null
    and public.engineering_category_name(category_id) = public.current_user_bom_category()
  )
)
with check (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'leader'
    and category_id is not null
    and public.engineering_category_name(category_id) = public.current_user_bom_category()
  )
);
