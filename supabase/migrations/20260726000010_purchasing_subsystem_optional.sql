-- FSAE ERP: 구매 요청에서 Subsystem 지정을 선택 사항으로 바꾸고, 신규/기존 차량 모두 "공용"(common) 카테고리와 예산을 갖도록 한다.
-- 20260726000009_purchasing_category_enum.sql이 먼저(별도 트랜잭션으로) 실행되어 있어야 한다.
-- 재실행해도 안전하도록(idempotent) 작성함.

alter table public.purchase_requests
  alter column subsystem_id drop not null;

-- 신규 차량 생성 시 5개(chassis/powertrain/aero/electrical/common) 카테고리 + 예산이 함께 생성되도록 트리거 갱신.
create or replace function public.create_default_engineering_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category_id uuid;
  v_category_name public.bom_category;
begin
  insert into public.budgets (vehicle_id, category_id, allocated_budget)
  values (new.id, null, 0);

  foreach v_category_name in array array['chassis', 'powertrain', 'aero', 'electrical', 'common']::public.bom_category[]
  loop
    insert into public.engineering_categories (vehicle_id, name)
    values (new.id, v_category_name)
    returning id into v_category_id;

    insert into public.budgets (vehicle_id, category_id, allocated_budget)
    values (new.id, v_category_id, 0);
  end loop;

  return new;
end;
$$;

-- 기존에 이미 생성된 차량들에도 "공용" 카테고리 + 예산 행을 소급 생성한다.
do $$
declare
  v_vehicle record;
  v_category_id uuid;
begin
  for v_vehicle in select id from public.vehicles loop
    if not exists (
      select 1 from public.engineering_categories
      where vehicle_id = v_vehicle.id and name = 'common'
    ) then
      insert into public.engineering_categories (vehicle_id, name)
      values (v_vehicle.id, 'common')
      returning id into v_category_id;

      insert into public.budgets (vehicle_id, category_id, allocated_budget)
      values (v_vehicle.id, v_category_id, 0);
    end if;
  end loop;
end $$;
