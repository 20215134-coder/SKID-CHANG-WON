import { z } from "zod";

export const createDataEntrySchema = z.object({
  category: z.string().trim().min(1, "카테고리를 입력해주세요."),
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  description: z.string().trim().optional(),
  relatedVehicleId: z.string().uuid().optional(),
});

export const updateDataEntrySchema = z.object({
  id: z.string().uuid(),
  category: z.string().trim().min(1, "카테고리를 입력해주세요."),
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  description: z.string().trim().optional(),
  relatedVehicleId: z.string().uuid().optional(),
});
