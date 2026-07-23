import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/require-user";
import { canManagePlans } from "@/lib/planning/permissions";
import { listAnnualPlans } from "@/services/annual-plan-service";
import { AnnualPlanTable } from "@/components/planning/annual-plan-table";
import { CreateAnnualPlanButton } from "@/components/planning/create-annual-plan-button";

export const metadata: Metadata = {
  title: "연간 계획 | FSAE ERP",
};

export default async function AnnualPlansPage() {
  const profile = await requireUser();
  const plans = await listAnnualPlans();

  const canManage = canManagePlans(profile);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">연간 계획</h2>
          <p className="text-sm text-muted-foreground">시즌별 연간 계획과 마일스톤을 관리합니다.</p>
        </div>
        {canManage ? <CreateAnnualPlanButton /> : null}
      </div>

      <AnnualPlanTable plans={plans} canManage={canManage} canDelete={profile.role === "admin"} />
    </div>
  );
}
