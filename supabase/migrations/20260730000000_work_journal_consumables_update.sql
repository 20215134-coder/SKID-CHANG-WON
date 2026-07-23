-- FSAE ERP: 작업일지 수정 시 소모품 사용내역도 자유롭게 수정/삭제할 수 있게 한다.
-- 수량을 늘리면 차이만큼 추가 차감(work_journal_consumption), 줄이면 차이만큼 반납(in),
-- 항목을 완전히 빼면 전량 반납한다. 기존 inventory_movements 행은 절대 수정/삭제하지 않고,
-- 변경분만 새 이력으로 추가해 감사 추적을 그대로 유지한다.
-- 재실행해도 안전하도록(idempotent) 작성함.

create or replace function public.update_work_journal_consumables(
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
  v_new_quantity numeric;
  v_old_quantity numeric;
  v_delta numeric;
  v_inventory_item public.inventory_items;
  v_new_stock numeric;
  v_seen_item_ids uuid[] := '{}';
  v_existing record;
begin
  if not public.can_edit_work_journal(p_journal_id) then
    raise exception '이 작업일지를 편집할 권한이 없습니다.';
  end if;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_item_id := (v_item ->> 'item_id')::uuid;
    v_new_quantity := (v_item ->> 'quantity')::numeric;

    if v_new_quantity is null or v_new_quantity <= 0 then
      raise exception '소모 수량은 0보다 커야 합니다.';
    end if;

    v_seen_item_ids := array_append(v_seen_item_ids, v_item_id);

    select quantity_used into v_old_quantity
    from public.work_journal_consumables
    where journal_id = p_journal_id and inventory_item_id = v_item_id;

    if not found then
      v_old_quantity := 0;
    end if;

    v_delta := v_new_quantity - v_old_quantity;

    if v_delta <> 0 then
      select * into v_inventory_item from public.inventory_items where id = v_item_id for update;
      if not found then
        raise exception '재고 항목을 찾을 수 없습니다.';
      end if;

      v_new_stock := v_inventory_item.current_quantity - v_delta;
      if v_new_stock < 0 then
        raise exception '재고가 부족합니다: %', v_inventory_item.item_name;
      end if;

      update public.inventory_items
      set
        current_quantity = v_new_stock,
        status = case
          when status = 'discontinued' then status
          when v_new_stock <= 0 then 'out_of_stock'
          when v_new_stock <= minimum_quantity then 'low_stock'
          else 'in_stock'
        end
      where id = v_item_id;

      insert into public.inventory_movements (
        inventory_item_id, movement_type, quantity, previous_quantity, new_quantity,
        reason, performed_by, reference_type, reference_id
      )
      values (
        v_item_id,
        case when v_delta > 0 then 'work_journal_consumption' else 'in' end,
        abs(v_delta),
        v_inventory_item.current_quantity,
        v_new_stock,
        case when v_delta > 0 then 'Work Journal 수정 - 추가 소모' else 'Work Journal 수정 - 반납' end,
        auth.uid(),
        'work_journal',
        p_journal_id
      );
    end if;

    insert into public.work_journal_consumables (journal_id, inventory_item_id, quantity_used)
    values (p_journal_id, v_item_id, v_new_quantity)
    on conflict (journal_id, inventory_item_id)
    do update set quantity_used = excluded.quantity_used;
  end loop;

  for v_existing in
    select inventory_item_id, quantity_used
    from public.work_journal_consumables
    where journal_id = p_journal_id
      and not (inventory_item_id = any(v_seen_item_ids))
  loop
    select * into v_inventory_item from public.inventory_items where id = v_existing.inventory_item_id for update;
    if found then
      v_new_stock := v_inventory_item.current_quantity + v_existing.quantity_used;

      update public.inventory_items
      set
        current_quantity = v_new_stock,
        status = case
          when status = 'discontinued' then status
          when v_new_stock <= 0 then 'out_of_stock'
          when v_new_stock <= minimum_quantity then 'low_stock'
          else 'in_stock'
        end
      where id = v_existing.inventory_item_id;

      insert into public.inventory_movements (
        inventory_item_id, movement_type, quantity, previous_quantity, new_quantity,
        reason, performed_by, reference_type, reference_id
      )
      values (
        v_existing.inventory_item_id, 'in', v_existing.quantity_used,
        v_inventory_item.current_quantity, v_new_stock,
        'Work Journal 수정 - 항목 삭제로 반납', auth.uid(), 'work_journal', p_journal_id
      );
    end if;

    delete from public.work_journal_consumables
    where journal_id = p_journal_id and inventory_item_id = v_existing.inventory_item_id;
  end loop;
end;
$$;

grant execute on function public.update_work_journal_consumables(uuid, jsonb) to authenticated;
