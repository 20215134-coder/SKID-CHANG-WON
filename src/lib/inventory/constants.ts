import type { InventoryCategory, InventoryItemStatus, InventoryMovementType } from "@/types/database.types";

export const INVENTORY_CATEGORIES: InventoryCategory[] = ["fastener", "consumable", "electrical"];

export const INVENTORY_CATEGORY_LABELS: Record<InventoryCategory, string> = {
  fastener: "체결류",
  consumable: "소모품",
  electrical: "전기팀 물품",
};

export const INVENTORY_ITEM_STATUSES: InventoryItemStatus[] = ["in_stock", "low_stock", "out_of_stock", "discontinued"];

export const INVENTORY_ITEM_STATUS_LABELS: Record<InventoryItemStatus, string> = {
  in_stock: "재고 있음",
  low_stock: "재고 부족",
  out_of_stock: "품절",
  discontinued: "단종",
};

export const MOVEMENT_TYPE_LABELS: Record<InventoryMovementType, string> = {
  in: "입고",
  out: "출고",
  adjustment: "조정",
  transfer: "위치 이동",
  work_journal_consumption: "작업일지 소모",
};
