-- FSAE ERP: 체결류 카탈로그에 단가/구매처를 추가한다.
-- Vehicle 비용보고서에서 체결류 비용을 계산하려면 필요하다.
-- 재실행해도 안전하도록(idempotent) 작성함.

alter table public.fasteners
  add column if not exists unit_cost numeric check (unit_cost is null or unit_cost >= 0),
  add column if not exists supplier text;
