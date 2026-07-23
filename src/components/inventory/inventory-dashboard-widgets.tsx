import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MovementTypeBadge } from "@/components/inventory/movement-type-badge";
import type { InventoryDashboardStats } from "@/services/inventory-dashboard-service";

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function InventoryDashboardWidgets({
  stats,
  canSeeValue,
}: {
  stats: InventoryDashboardStats;
  canSeeValue: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className={`grid gap-4 sm:grid-cols-2 ${canSeeValue ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        <Link href="/dashboard/inventory">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">전체 재고 항목</CardTitle>
              <CardDescription>{stats.totalItems}개</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        {canSeeValue ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">총 재고 가치</CardTitle>
              <CardDescription>{formatCurrency(stats.totalAssetValue)}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}
        <Link href="/dashboard/inventory?status=low_stock">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">재고 부족</CardTitle>
              <CardDescription>{stats.lowStockCount}개</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/dashboard/inventory?status=out_of_stock">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">품절</CardTitle>
              <CardDescription>{stats.outOfStockCount}개</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">최근 이동 이력</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentMovements.length === 0 ? (
            <p className="text-sm text-muted-foreground">최근 이력이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {stats.recentMovements.map((movement) => (
                <li key={movement.id} className="flex items-center gap-2 text-sm">
                  <MovementTypeBadge movementType={movement.movementType} />
                  <span className="min-w-0 truncate">
                    {movement.itemCode} · {movement.itemName}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {movement.previousQuantity}→{movement.newQuantity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
