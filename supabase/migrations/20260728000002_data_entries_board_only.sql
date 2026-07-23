-- FSAE ERP: Data 모듈에서 key-value 필드 스펙 기능을 제거한다.
-- 사용자가 필드 없이 제목/카테고리/간단한 내용/파일만으로 게시판처럼 쓰길 원해서,
-- 구조화된 data_entry_fields는 완전히 없앤다 (data_entries/data_entry_files는 그대로 유지).
-- 재실행해도 안전하도록(idempotent) 작성함.

drop table if exists public.data_entry_fields cascade;
