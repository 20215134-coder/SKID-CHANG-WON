import Link from "next/link";

import { formatCurrency } from "@/lib/purchasing/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  PurchaseDashboardSummary,
  RecentPurchase,
  TopSpendingCategory,
  TopSupplier,
} from "@/services/purchase-dashboard-service";

export function PurchaseDashboardWidgets({
  summary,
  recentPurchases,
  topCategories,
  topSuppliers,
}: {
  summary: PurchaseDashboardSummary;
  recentPurchases: RecentPurchase[];
  topCategories: TopSpendingCategory[];
  topSuppliers: TopSupplier[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">승인 대기</CardTitle>
            <CardDescription>{summary.pendingApprovals}건</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">이번 달 구매</CardTitle>
            <CardDescription>{summary.purchasesThisMonth}건</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">총 지출</CardTitle>
            <CardDescription>{formatCurrency(summary.totalSpending)}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">잔여 예산</CardTitle>
            <CardDescription>{formatCurrency(summary.totalRemaining)}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">예산 사용률</CardTitle>
            <CardDescription>{Math.round(summary.budgetUsagePercent)}%</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">최근 구매</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPurchases.length === 0 ? (
              <p className="text-sm text-muted-foreground">최근 구매 완료된 항목이 없습니다.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {recentPurchases.map((purchase) => (
                  <li key={purchase.id} className="flex items-center justify-between gap-2 text-sm">
                    <Link href={`/dashboard/purchasing/${purchase.id}`} className="min-w-0 truncate hover:underline">
                      {purchase.title}
                    </Link>
                    <span className="shrink-0 text-muted-foreground">{formatCurrency(purchase.finalCost)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">카테고리별 지출 Top 5</CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {topCategories.map((category) => (
                  <li key={category.category} className="flex items-center justify-between gap-2 text-sm">
                    <span>{category.categoryLabel}</span>
                    <span className="text-muted-foreground">{formatCurrency(category.totalSpent)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Supplier별 지출 Top 5</CardTitle>
          </CardHeader>
          <CardContent>
            {topSuppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {topSuppliers.map((supplier) => (
                  <li key={supplier.supplier} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">{supplier.supplier}</span>
                    <span className="shrink-0 text-muted-foreground">{formatCurrency(supplier.totalSpent)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
