import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/require-user";
import { listVehicles } from "@/services/vehicle-service";
import { listBudgetsForVehicle } from "@/services/budget-service";
import { listRecentPurchases } from "@/services/purchase-dashboard-service";
import { RecentPurchasesCard } from "@/components/purchasing/recent-purchases-card";
import { VehicleBudgetTree } from "@/components/purchasing/budget-tree";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";
import type { Budget } from "@/services/budget-service";

function canManageBudget(profile: { role: string; bomCategory: string | null }, budget: Budget): boolean {
  if (profile.role === "admin") return true;
  return profile.role === "leader" && budget.categoryId !== null && budget.categoryName === profile.bomCategory;
}

export const metadata: Metadata = {
  title: "예산 | SKID",
};

export default async function PurchasingBudgetPage() {
  const profile = await requireUser();

  const [vehicles, recentPurchases] = await Promise.all([listVehicles(), listRecentPurchases(5)]);
  const budgetsByVehicle = await Promise.all(vehicles.map((vehicle) => listBudgetsForVehicle(vehicle.id)));

  return (
    <div className="flex flex-col gap-6">
      <VehicleBreadcrumb items={[{ label: "Purchasing", href: "/dashboard/purchasing" }, { label: "예산" }]} />

      <div>
        <h2 className="text-2xl font-semibold tracking-tight">예산 관리</h2>
        <p className="text-sm text-muted-foreground">차량별 전체 예산과 엔지니어링 카테고리별 예산 사용 현황입니다.</p>
      </div>

      {vehicles.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">등록된 차량이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {vehicles.map((vehicle, index) => {
            const budgets = budgetsByVehicle[index];
            const totalBudget = budgets.find((budget) => budget.categoryId === null);
            // "공용"은 예산 트리에서는 4개 엔지니어링 팀 예산만 보여주기 위해 제외한다(구매/Task 카테고리 선택지로는 계속 사용됨).
            const categoryBudgets = budgets.filter((budget) => budget.categoryId !== null && budget.categoryName !== "common");

            if (!totalBudget) {
              return (
                <div key={vehicle.id} className="rounded-lg border p-3 text-sm text-muted-foreground">
                  {vehicle.competitionYear} 시즌 · {vehicle.vehicleName}: 예산이 아직 초기화되지 않았습니다. 관리자에게 문의해주세요.
                </div>
              );
            }

            return (
              <VehicleBudgetTree
                key={vehicle.id}
                vehicleName={vehicle.vehicleName}
                competitionYear={vehicle.competitionYear}
                totalBudget={{ ...totalBudget, canManage: canManageBudget(profile, totalBudget) }}
                categoryBudgets={categoryBudgets.map((budget) => ({ ...budget, canManage: canManageBudget(profile, budget) }))}
              />
            );
          })}
        </div>
      )}

      <RecentPurchasesCard purchases={recentPurchases} />
    </div>
  );
}
