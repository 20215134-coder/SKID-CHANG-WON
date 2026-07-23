import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요.").max(200),
  content: z.string().trim().min(1, "내용을 입력해주세요."),
});

export const updateAnnouncementSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1, "제목을 입력해주세요.").max(200),
  content: z.string().trim().min(1, "내용을 입력해주세요."),
});
