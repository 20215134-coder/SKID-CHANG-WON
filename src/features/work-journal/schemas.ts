import { z } from "zod";

const BOM_CATEGORY_VALUES = ["chassis", "powertrain", "aero", "electrical", "common"] as const;

const uuidOrEmpty = z
  .string()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .pipe(z.string().uuid().optional());

const participantIdsSchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  });

const consumablesSchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (item): item is { itemId: string; quantity: number } =>
            typeof item === "object" && item !== null && typeof item.itemId === "string" && typeof item.quantity === "number",
        )
        .filter((item) => item.quantity > 0);
    } catch {
      return [];
    }
  });

export const workJournalFormSchema = z
  .object({
    title: z.string().trim().min(1, "제목을 입력해주세요.").max(200),
    content: z.string().default(""),
    vehicleId: z.string().uuid("차량을 선택해주세요."),
    engineeringCategory: z.enum(BOM_CATEGORY_VALUES, { error: "카테고리를 선택해주세요." }),
    subsystemId: uuidOrEmpty,
    assemblyId: uuidOrEmpty,
    workStart: z.string().min(1, "작업 시작 시각을 입력해주세요."),
    workEnd: z.string().min(1, "작업 종료 시각을 입력해주세요."),
    participantIds: participantIdsSchema,
    consumables: consumablesSchema,
  })
  .refine((data) => new Date(data.workEnd) >= new Date(data.workStart), {
    message: "작업 종료 시각은 시작 시각보다 늦어야 합니다.",
    path: ["workEnd"],
  });

export const updateWorkJournalFormSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().trim().min(1, "제목을 입력해주세요.").max(200),
    content: z.string().default(""),
    vehicleId: z.string().uuid("차량을 선택해주세요."),
    engineeringCategory: z.enum(BOM_CATEGORY_VALUES, { error: "카테고리를 선택해주세요." }),
    subsystemId: uuidOrEmpty,
    assemblyId: uuidOrEmpty,
    workStart: z.string().min(1, "작업 시작 시각을 입력해주세요."),
    workEnd: z.string().min(1, "작업 종료 시각을 입력해주세요."),
    participantIds: participantIdsSchema,
  })
  .refine((data) => new Date(data.workEnd) >= new Date(data.workStart), {
    message: "작업 종료 시각은 시작 시각보다 늦어야 합니다.",
    path: ["workEnd"],
  });
