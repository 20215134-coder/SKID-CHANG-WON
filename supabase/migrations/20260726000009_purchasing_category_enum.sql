-- FSAE ERP: Engineering Category에 "공용"(common) 항목을 추가한다.
-- Postgres 제약상 새로 추가한 enum 값은 이 값을 추가한 트랜잭션 밖에서만 사용할 수 있으므로,
-- 이 파일은 반드시 단독으로 먼저 실행하고, 그 다음 마이그레이션 파일을 별도로 실행해야 한다.

alter type public.bom_category add value if not exists 'common';
