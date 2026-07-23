-- FSAE ERP: BOM Part가 Consumable Inventory 항목뿐 아니라 Assets(제작된 부품/장비)도 자재 출처로 연결할 수 있게 한다.
-- 한 Part는 재고 항목 또는 자산 중 하나에만 연결할 수 있다(동시에 둘 다는 불가).
-- 재실행해도 안전하도록(idempotent) 작성함.

alter table public.bom_parts
  add column if not exists asset_id uuid references public.assets (id) on delete set null;

create index if not exists bom_parts_asset_id_idx on public.bom_parts (asset_id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bom_parts_single_material_source') then
    alter table public.bom_parts
      add constraint bom_parts_single_material_source
      check (inventory_item_id is null or asset_id is null);
  end if;
end $$;
