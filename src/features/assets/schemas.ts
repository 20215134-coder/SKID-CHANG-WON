import { z } from "zod";

const CONDITION_VALUES = ["excellent", "good", "fair", "poor", "out_of_service"] as const;
const BOM_CATEGORY_VALUES = ["chassis", "powertrain", "aero", "electrical"] as const;

export const createAssetSchema = z.object({
  assetNumber: z.string().trim().min(1, "자산 번호를 입력해주세요."),
  assetName: z.string().trim().min(1, "자산 이름을 입력해주세요."),
  engineeringCategory: z.enum(BOM_CATEGORY_VALUES).optional(),
  description: z.string().trim().optional(),
  currentCondition: z.enum(CONDITION_VALUES),
  purchaseDate: z.string().trim().optional(),
  purchaseCost: z.coerce.number().nonnegative("구매 비용은 0 이상이어야 합니다.").optional(),
  assignedTo: z.string().uuid().optional(),
  notes: z.string().trim().optional(),
  sourcePurchaseRequestId: z.string().uuid().optional(),
});

export const updateAssetSchema = z.object({
  id: z.string().uuid(),
  assetNumber: z.string().trim().min(1, "자산 번호를 입력해주세요."),
  assetName: z.string().trim().min(1, "자산 이름을 입력해주세요."),
  engineeringCategory: z.enum(BOM_CATEGORY_VALUES).optional(),
  description: z.string().trim().optional(),
  currentCondition: z.enum(CONDITION_VALUES),
  purchaseDate: z.string().trim().optional(),
  purchaseCost: z.coerce.number().nonnegative("구매 비용은 0 이상이어야 합니다.").optional(),
  assignedTo: z.string().uuid().optional(),
  notes: z.string().trim().optional(),
});
