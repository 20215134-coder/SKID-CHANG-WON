import { z } from "zod";

const ANNUAL_PLAN_STATUS_VALUES = ["planning", "active", "completed", "archived"] as const;
const MILESTONE_STATUS_VALUES = ["planned", "completed"] as const;

export const annualPlanFormSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  description: z.string().trim().optional(),
  season: z.coerce.number().int().min(2000, "연도를 확인해주세요."),
  startDate: z.string().min(1, "시작일을 입력해주세요."),
  endDate: z.string().min(1, "종료일을 입력해주세요."),
  status: z.enum(ANNUAL_PLAN_STATUS_VALUES),
});

export const milestoneFormSchema = z.object({
  annualPlanId: z.string().uuid(),
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  description: z.string().trim().optional(),
  dueDate: z.string().min(1, "마감일을 입력해주세요."),
  status: z.enum(MILESTONE_STATUS_VALUES),
});
