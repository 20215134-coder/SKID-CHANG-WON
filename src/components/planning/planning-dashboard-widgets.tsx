import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MilestoneStatusBadge } from "@/components/planning/milestone-status-badge";
import type { PlanningDashboardData } from "@/services/planning-dashboard-service";
import type { Milestone } from "@/services/milestone-service";

function MilestoneList({ milestones, emptyMessage }: { milestones: Milestone[]; emptyMessage: string }) {
  if (milestones.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {milestones.map((milestone) => (
        <li key={milestone.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
          <span className="min-w-0 truncate">{milestone.title}</span>
          <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            {milestone.dueDate}
            <MilestoneStatusBadge status={milestone.status} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PlanningDashboardWidgets({ data }: { data: PlanningDashboardData }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">이번 달 마감</CardTitle>
        </CardHeader>
        <CardContent>
          <MilestoneList milestones={data.thisMonthDeadlines} emptyMessage="이번 달 마감 예정인 마일스톤이 없습니다." />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">다가오는 마감</CardTitle>
        </CardHeader>
        <CardContent>
          <MilestoneList milestones={data.upcomingDeadlines} emptyMessage="다가오는 마일스톤이 없습니다." />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">완료된 마일스톤</CardTitle>
        </CardHeader>
        <CardContent>
          <MilestoneList milestones={data.completedMilestones} emptyMessage="완료된 마일스톤이 없습니다." />
        </CardContent>
      </Card>
    </div>
  );
}
