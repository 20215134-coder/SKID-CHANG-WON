-- FSAE ERP: Work Journal 저장 시 소모품 사용을 재고에서 원자적으로 차감하고 이동 이력을 남긴다.
-- p_items: [{"item_id": "uuid", "quantity": number}, ...] 형태의 jsonb 배열.
-- 하나라도 재고가 부족하면 전체가 롤백된다(부분 차감 없음). 이 RPC를 통해서만
-- work_journal_consumables 행이 생성되므로, 재고는 절대 0 미만이 될 수 없다.
-- 재실행해도 안전하도록(idempotent) 작성함.

create or replace function public.record_work_journal_consumables(
  p_journal_id uuid,
  p_items jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_item_id uuid;
  v_quantity numeric;
  v_inventory_item public.inventory_items;
  v_new_quantity numeric;
begin
  if not public.can_edit_work_journal(p_journal_id) then
    raise exception '이 작업일지를 편집할 권한이 없습니다.';
  end if;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_item_id := (v_item ->> 'item_id')::uuid;
    v_quantity := (v_item ->> 'quantity')::numeric;

    if v_quantity is null or v_quantity <= 0 then
      raise exception '소모 수량은 0보다 커야 합니다.';
    end if;

    select * into v_inventory_item from public.inventory_items where id = v_item_id for update;
    if not found then
      raise exception '재고 항목을 찾을 수 없습니다.';
    end if;

    v_new_quantity := v_inventory_item.current_quantity - v_quantity;
    if v_new_quantity < 0 then
      raise exception '재고가 부족합니다: %', v_inventory_item.item_name;
    end if;

    update public.inventory_items
    set
      current_quantity = v_new_quantity,
      status = case
        when status = 'discontinued' then status
        when v_new_quantity <= 0 then 'out_of_stock'
        when v_new_quantity <= minimum_quantity then 'low_stock'
        else 'in_stock'
      end
    where id = v_item_id;

    insert into public.inventory_movements (
      inventory_item_id, movement_type, quantity, previous_quantity, new_quantity,
      reason, performed_by, reference_type, reference_id
    )
    values (
      v_item_id, 'work_journal_consumption', v_quantity, v_inventory_item.current_quantity, v_new_quantity,
      'Work Journal 소모', auth.uid(), 'work_journal', p_journal_id
    );

    insert into public.work_journal_consumables (journal_id, inventory_item_id, quantity_used)
    values (p_journal_id, v_item_id, v_quantity);
  end loop;
end;
$$;

grant execute on function public.record_work_journal_consumables(uuid, jsonb) to authenticated;
