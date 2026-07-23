import { z } from "zod";

const STATUS_VALUES = [
  "designing",
  "ready_for_manufacturing",
  "manufacturing",
  "inspection",
  "assembly",
  "completed",
] as const;

export const partFormSchema = z
  .object({
    assemblyId: z.string().uuid(),
    partNumber: z.string().trim().min(1, "Part Number를 입력해주세요."),
    partName: z.string().trim().min(1, "Part Name을 입력해주세요."),
    revision: z.string().trim().min(1, "Revision을 입력해주세요."),
    material: z.string().trim().optional(),
    weight: z.coerce.number().nonnegative("Weight는 0 이상이어야 합니다.").optional(),
    manufacturingStatus: z.enum(STATUS_VALUES),
    ownerId: z.string().uuid().optional(),
    supplier: z.string().trim().optional(),
    description: z.string().trim().optional(),
    inventoryItemId: z.string().uuid().optional(),
    assetId: z.string().uuid().optional(),
    materialQuantity: z.coerce.number().positive("소요 수량은 0보다 커야 합니다.").optional(),
  })
  .refine((data) => !(data.inventoryItemId && data.assetId), {
    message: "재고 항목과 자산 중 하나만 연결할 수 있습니다.",
    path: ["assetId"],
  });

export type PartFormInput = z.infer<typeof partFormSchema>;
