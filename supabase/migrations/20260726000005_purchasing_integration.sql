-- FSAE ERP: 구매 완료 항목을 재고/자산으로 중복 입력 없이 등록할 수 있도록 출처 FK를 추가한다.
-- 재실행해도 안전하도록(idempotent) 작성함.

alter table public.inventory_items
  add column if not exists source_purchase_request_id uuid references public.purchase_requests (id) on delete set null;
