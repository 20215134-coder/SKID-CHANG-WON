-- FSAE ERP: BOM Part에서 Consumable Inventory 항목을 연결해 자재비를 계산할 수 있게 한다.
-- inventory_items.unit_cost * bom_parts.material_quantity = 해당 파트의 예상 자재비.
-- 재실행해도 안전하도록(idempotent) 작성함.

alter table public.bom_parts
  add column if not exists inventory_item_id uuid references public.inventory_items (id) on delete set null,
  add column if not exists material_quantity numeric not null default 1 check (material_quantity > 0);

create index if not exists bom_parts_inventory_item_id_idx on public.bom_parts (inventory_item_id);
