import { z } from "zod";

import { NEW_FASTENER_VALUE } from "./constants";

export const createFastenerSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요."),
  spec: z.string().trim().optional(),
  unitCost: z.coerce.number().nonnegative("단가는 0 이상이어야 합니다.").optional(),
  supplier: z.string().trim().optional(),
});

export const updateFastenerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "이름을 입력해주세요."),
  spec: z.string().trim().optional(),
  unitCost: z.coerce.number().nonnegative("단가는 0 이상이어야 합니다.").optional(),
  supplier: z.string().trim().optional(),
});

export const addAssemblyFastenerSchema = z
  .object({
    assemblyId: z.string().uuid(),
    fastenerId: z.string().min(1, "체결류를 선택해주세요."),
    newFastenerName: z.string().trim().optional(),
    newFastenerSpec: z.string().trim().optional(),
    newFastenerUnitCost: z.coerce.number().nonnegative("단가는 0 이상이어야 합니다.").optional(),
    newFastenerSupplier: z.string().trim().optional(),
    quantity: z.coerce.number().int().positive("수량은 1 이상이어야 합니다."),
  })
  .refine((data) => data.fastenerId !== NEW_FASTENER_VALUE || (data.newFastenerName && data.newFastenerName.length > 0), {
    message: "새 체결류 이름을 입력해주세요.",
    path: ["newFastenerName"],
  });

export const updateAssemblyFastenerSchema = z.object({
  id: z.string().uuid(),
  quantity: z.coerce.number().int().positive("수량은 1 이상이어야 합니다."),
});
