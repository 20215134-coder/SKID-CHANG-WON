-- FSAE ERP: Assets를 자유 텍스트 category 대신, Vehicle/Tasks와 동일한 4개 Engineering Category로 분류한다.
-- 자산이 특정 팀 소유가 아닐 수도 있으므로 nullable로 둔다 (예: 공용 3D 프린터).
-- 재실행해도 안전하도록(idempotent) 작성함.

alter table public.assets
  add column if not exists engineering_category public.bom_category;

alter table public.assets
  drop column if exists category;

create index if not exists assets_engineering_category_idx on public.assets (engineering_category);
