import type { AnnualPlanStatus, MilestoneStatus } from "@/types/database.types";

export const ANNUAL_PLAN_STATUSES: AnnualPlanStatus[] = ["planning", "active", "completed", "archived"];

export const ANNUAL_PLAN_STATUS_LABELS: Record<AnnualPlanStatus, string> = {
  planning: "계획 중",
  active: "진행 중",
  completed: "완료",
  archived: "보관됨",
};

export const MILESTONE_STATUSES: MilestoneStatus[] = ["planned", "completed"];

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  planned: "예정",
  completed: "완료",
};
