import { z } from "zod";

const PRIORITY_VALUES = ["low", "normal", "high", "urgent"] as const;

export const purchaseRequestFormSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  description: z.string().trim().optional(),
  vehicleId: z.string().uuid("차량을 선택해주세요."),
  categoryId: z.string().uuid("카테고리를 선택해주세요."),
  subsystemId: z.string().uuid().optional(),
  assemblyId: z.string().uuid().optional(),
  partId: z.string().uuid().optional(),
  supplier: z.string().trim().optional(),
  productUrl: z.string().trim().optional(),
  quantity: z.coerce.number().int().positive("수량은 1 이상이어야 합니다."),
  estimatedCost: z.coerce.number().nonnegative("예상 비용은 0 이상이어야 합니다."),
  priority: z.enum(PRIORITY_VALUES),
});

export type PurchaseRequestFormInput = z.infer<typeof purchaseRequestFormSchema>;

export const rejectPurchaseRequestSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().min(1, "반려 사유를 입력해주세요."),
});

export const completePurchaseSchema = z.object({
  id: z.string().uuid(),
  finalCost: z.coerce.number().nonnegative("최종 비용은 0 이상이어야 합니다."),
  purchasedAt: z.string().min(1, "구매일을 입력해주세요."),
  purchaseNotes: z.string().trim().optional(),
});
