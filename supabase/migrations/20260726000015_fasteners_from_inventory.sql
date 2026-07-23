-- FSAE ERP: 체결류 전용 카탈로그(fasteners)를 없애고, Assembly의 체결류도 Consumable Inventory에서
-- (category='fastener') 선택해 연결하는 방식으로 통합한다. 체결류 관리 페이지는 더 이상 필요 없다.
-- 아직 프로덕션 데이터가 없으므로, 기존 assembly_fasteners 연결(옛 fasteners 카탈로그 참조)은 정리한다.
-- 재실행해도 안전하도록(idempotent) 작성함.

alter table public.assembly_fasteners
  add column if not exists inventory_item_id uuid references public.inventory_items (id) on delete restrict;

delete from public.assembly_fasteners where inventory_item_id is null;

alter table public.assembly_fasteners
  alter column inventory_item_id set not null;

alter table public.assembly_fasteners
  drop column if exists fastener_id;

drop table if exists public.fasteners cascade;

alter table public.assembly_fasteners drop constraint if exists assembly_fasteners_assembly_id_fastener_id_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'assembly_fasteners_assembly_id_inventory_item_id_key'
  ) then
    alter table public.assembly_fasteners
      add constraint assembly_fasteners_assembly_id_inventory_item_id_key unique (assembly_id, inventory_item_id);
  end if;
end $$;

create index if not exists assembly_fasteners_inventory_item_id_idx on public.assembly_fasteners (inventory_item_id);
