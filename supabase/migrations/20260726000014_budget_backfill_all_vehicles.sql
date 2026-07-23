-- FSAE ERP: 일부 차량이 budgets/engineering_categories 행을 전혀 갖지 못한 문제를 소급 복구한다.
-- (예: Purchasing/budgets 마이그레이션이 도입되기 전에 생성된 차량은 트리거가 실행되지 않아 예산 행이 없었다.)
-- 모든 차량에 대해 5개 엔지니어링 카테고리(chassis/powertrain/aero/electrical/common) + 차량 전체 예산 행 +
-- 카테고리별 예산 행이 반드시 존재하도록 보정한다.
-- 재실행해도 안전하도록(idempotent) 작성함.

do $$
declare
  v_vehicle record;
  v_category_name public.bom_category;
  v_category_id uuid;
begin
  for v_vehicle in select id from public.vehicles loop
    -- 차량 전체 예산 행(category_id is null) 보정
    if not exists (
      select 1 from public.budgets where vehicle_id = v_vehicle.id and category_id is null
    ) then
      insert into public.budgets (vehicle_id, category_id, allocated_budget)
      values (v_vehicle.id, null, 0);
    end if;

    foreach v_category_name in array array['chassis', 'powertrain', 'aero', 'electrical', 'common']::public.bom_category[]
    loop
      -- 엔지니어링 카테고리 행 보정
      select id into v_category_id
      from public.engineering_categories
      where vehicle_id = v_vehicle.id and name = v_category_name;

      if v_category_id is null then
        insert into public.engineering_categories (vehicle_id, name)
        values (v_vehicle.id, v_category_name)
        returning id into v_category_id;
      end if;

      -- 카테고리별 예산 행 보정
      if not exists (
        select 1 from public.budgets where vehicle_id = v_vehicle.id and category_id = v_category_id
      ) then
        insert into public.budgets (vehicle_id, category_id, allocated_budget)
        values (v_vehicle.id, v_category_id, 0);
      end if;
    end loop;
  end loop;
end $$;
