import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { canManagePlans } from "@/lib/planning/permissions";
import { getAnnualPlan } from "@/services/annual-plan-service";
import { listMilestones } from "@/services/milestone-service";
import { getPlanningDashboardData } from "@/services/planning-dashboard-service";
import { AnnualPlanStatusBadge } from "@/components/planning/annual-plan-status-badge";
import { CreateMilestoneButton } from "@/components/planning/create-milestone-button";
import { MilestoneTable } from "@/components/planning/milestone-table";
import { PlanningDashboardWidgets } from "@/components/planning/planning-dashboard-widgets";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const plan = await getAnnualPlan(id);
  return { title: `${plan?.title ?? "연간 계획"} | SKID` };
}

export default async function AnnualPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireUser();
  const { id } = await params;

  const plan = await getAnnualPlan(id);
  if (!plan) notFound();

  const [milestones, dashboardData] = await Promise.all([listMilestones(id), getPlanningDashboardData(id)]);

  const canManage = canManagePlans(profile);

  return (
    <div className="flex flex-col gap-4">
      <VehicleBreadcrumb items={[{ label: "Planning", href: "/dashboard/planning" }, { label: plan.title }]} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{plan.title}</h2>
          <p className="text-sm text-muted-foreground">
            {plan.season} 시즌 · {plan.startDate} ~ {plan.endDate}
          </p>
        </div>
        <AnnualPlanStatusBadge status={plan.status} />
      </div>

      {plan.description ? <p className="text-sm text-muted-foreground">{plan.description}</p> : null}

      <PlanningDashboardWidgets data={dashboardData} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">마일스톤</h3>
        {canManage ? <CreateMilestoneButton annualPlanId={id} /> : null}
      </div>

      <MilestoneTable milestones={milestones} canManage={canManage} />
    </div>
  );
}
