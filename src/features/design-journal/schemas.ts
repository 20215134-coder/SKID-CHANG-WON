import { z } from "zod";

const BOM_CATEGORY_VALUES = ["chassis", "powertrain", "aero", "electrical", "common"] as const;

const uuidOrEmpty = z
  .string()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .pipe(z.string().uuid().optional());

export const designJournalFormSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요.").max(200),
  content: z.string().default(""),
  vehicleId: z.string().uuid("차량을 선택해주세요."),
  engineeringCategory: z.enum(BOM_CATEGORY_VALUES, { error: "카테고리를 선택해주세요." }),
  subsystemId: uuidOrEmpty,
  assemblyId: uuidOrEmpty,
  tags: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    ),
});

export const updateDesignJournalFormSchema = designJournalFormSchema.extend({
  id: z.string().uuid(),
});
