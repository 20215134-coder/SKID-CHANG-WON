import { listMilestones, type Milestone } from "@/services/milestone-service";

export interface PlanningDashboardData {
  thisMonthDeadlines: Milestone[];
  upcomingDeadlines: Milestone[];
  completedMilestones: Milestone[];
}

export async function getPlanningDashboardData(annualPlanId: string): Promise<PlanningDashboardData> {
  const milestones = await listMilestones(annualPlanId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const isInRange = (dateStr: string, from: Date, to: Date) => {
    const date = new Date(`${dateStr}T00:00:00`);
    return date >= from && date <= to;
  };

  const thisMonthDeadlines = milestones.filter(
    (milestone) => milestone.status !== "completed" && isInRange(milestone.dueDate, monthStart, monthEnd),
  );

  const upcomingDeadlines = milestones
    .filter((milestone) => milestone.status !== "completed" && new Date(`${milestone.dueDate}T00:00:00`) > monthEnd)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const completedMilestones = milestones
    .filter((milestone) => milestone.status === "completed")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return { thisMonthDeadlines, upcomingDeadlines, completedMilestones };
}
