-- FSAE ERP: Consumable Inventory 카테고리를 자유 CRUD 테이블에서 3개 고정 카테고리로 단순화한다.
-- 체결류(fastener) / 소모품(consumable) / 전기팀 물품(electrical) 3가지로 줄인다.
-- 기존 데이터는 보존하되, 옛 카테고리 이름을 새 3가지 중 가장 가까운 값으로 재매핑한다.
-- 재실행해도 안전하도록(idempotent) 작성함.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'inventory_category') then
    create type public.inventory_category as enum ('fastener', 'consumable', 'electrical');
  end if;
end $$;

alter table public.inventory_items
  add column if not exists category public.inventory_category;

update public.inventory_items ii
set category = case
  when ic.name = 'Fasteners' then 'fastener'::public.inventory_category
  when ic.name = 'Electrical Components' then 'electrical'::public.inventory_category
  else 'consumable'::public.inventory_category
end
from public.inventory_categories ic
where ii.category_id = ic.id
  and ii.category is null;

update public.inventory_items
set category = 'consumable'::public.inventory_category
where category is null;

alter table public.inventory_items
  alter column category set not null;

alter table public.inventory_items
  drop column if exists category_id;

drop table if exists public.inventory_categories cascade;

create index if not exists inventory_items_category_idx on public.inventory_items (category);
