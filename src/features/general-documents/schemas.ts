import { z } from "zod";

const DOCUMENT_CATEGORY_VALUES = ["rules", "design_report", "cost_report", "ses", "team_documents", "other"] as const;

export const uploadGeneralDocumentSchema = z.object({
  category: z.enum(DOCUMENT_CATEGORY_VALUES),
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  description: z.string().trim().optional(),
});

export const updateGeneralDocumentSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(DOCUMENT_CATEGORY_VALUES),
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  description: z.string().trim().optional(),
});
