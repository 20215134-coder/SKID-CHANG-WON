import { z } from "zod";

const STATUS_VALUES = ["in_stock", "low_stock", "out_of_stock", "discontinued"] as const;
const CATEGORY_VALUES = ["fastener", "consumable", "electrical"] as const;

const inventoryItemFieldsSchema = {
  itemCode: z.string().trim().min(1, "품목 코드를 입력해주세요."),
  itemName: z.string().trim().min(1, "품목명을 입력해주세요."),
  category: z.enum(CATEGORY_VALUES),
  manufacturer: z.string().trim().optional(),
  supplier: z.string().trim().optional(),
  description: z.string().trim().optional(),
  minimumQuantity: z.coerce.number().nonnegative("최소 수량은 0 이상이어야 합니다."),
  unit: z.string().trim().min(1, "단위를 입력해주세요."),
  unitCost: z.coerce.number().nonnegative("단가는 0 이상이어야 합니다.").optional(),
  relatedPartId: z.string().uuid().optional(),
  owningDepartment: z.string().trim().optional(),
  sourcePurchaseRequestId: z.string().uuid().optional(),
};

// 생성 시에만 초기 수량과 최초 보관 위치를 입력받는다. 이후 수량/위치 변경은 Stock 이동(RPC)으로만 처리한다.
export const createInventoryItemSchema = z.object({
  ...inventoryItemFieldsSchema,
  currentQuantity: z.coerce.number().nonnegative("현재 수량은 0 이상이어야 합니다."),
  storageLocation: z.string().trim().optional(),
});

// 상태(status)는 관리자/리더가 직접 지정할 수 있다 (Discontinued 수동 고정을 위해).
export const updateInventoryItemSchema = z.object({
  ...inventoryItemFieldsSchema,
  id: z.string().uuid(),
  status: z.enum(STATUS_VALUES),
});

export const stockMovementSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.coerce.number().positive("수량은 0보다 커야 합니다."),
  reason: z.string().trim().optional(),
});

export const stockAdjustmentSchema = z.object({
  itemId: z.string().uuid(),
  newQuantity: z.coerce.number().nonnegative("수량은 0 이상이어야 합니다."),
  reason: z.string().trim().optional(),
});

export const stockTransferSchema = z.object({
  itemId: z.string().uuid(),
  newLocation: z.string().trim().min(1, "이동할 보관 위치를 입력해주세요."),
  reason: z.string().trim().optional(),
});
