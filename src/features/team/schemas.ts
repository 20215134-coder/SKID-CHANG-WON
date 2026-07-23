import { z } from "zod";

export const updateMemberSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().trim().min(1, "이름을 입력해주세요."),
  studentId: z.string().trim().min(1, "학번을 입력해주세요."),
  phone: z.string().trim().optional(),
  joinedAt: z.string().min(1, "가입일을 선택해주세요."),
  department: z.string().trim().optional(),
  role: z.enum(["admin", "leader", "member"]).optional(),
  bomCategory: z.enum(["chassis", "powertrain", "aero", "electrical", "none"]).optional(),
});

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
