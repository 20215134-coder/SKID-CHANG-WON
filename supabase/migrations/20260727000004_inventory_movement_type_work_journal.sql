-- FSAE ERP: Work Journal 소모품 사용을 위한 movement_type 값 추가.
-- Postgres 제약상 enum에 새 값을 추가하는 트랜잭션에서는 그 값을 바로 사용할 수 없으므로,
-- 이 값을 사용하는 RPC(record_work_journal_consumables)는 반드시 다음 마이그레이션 파일에서 별도로 정의한다.
-- 이 마이그레이션만 단독으로 먼저 실행해야 한다.

do $$
begin
  if not exists (
    select 1 from pg_enum where enumlabel = 'work_journal_consumption' and enumtypid = 'public.inventory_movement_type'::regtype
  ) then
    alter type public.inventory_movement_type add value 'work_journal_consumption';
  end if;
end $$;
