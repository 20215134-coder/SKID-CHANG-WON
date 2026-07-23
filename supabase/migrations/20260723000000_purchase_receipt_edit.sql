-- FSAE ERP: 구매 완료 후에도 영수증 파일을 다시 교체할 수 있도록 타임라인 이벤트 종류를 추가한다.
-- 재실행해도 안전하도록(idempotent) 작성함.

alter type public.purchase_timeline_event add value if not exists 'receipt_updated';
