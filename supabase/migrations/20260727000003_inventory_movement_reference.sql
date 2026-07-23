-- FSAE ERP: inventory_movements가 Work Journal 같은 다른 레코드를 가리킬 수 있도록 일반화된 참조 컬럼을 추가한다.
-- reference_type/reference_id는 특정 모듈에 종속되지 않는 범용 컬럼으로, 앞으로 다른 모듈에서도 재사용할 수 있다.
-- 재실행해도 안전하도록(idempotent) 작성함.

alter table public.inventory_movements
  add column if not exists reference_type text,
  add column if not exists reference_id uuid;

create index if not exists inventory_movements_reference_idx on public.inventory_movements (reference_type, reference_id);
