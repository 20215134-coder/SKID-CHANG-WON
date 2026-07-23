import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/purchasing/format";
import type { RecentPurchase } from "@/services/purchase-dashboard-service";

export function RecentPurchasesCard({ purchases }: { purchases: RecentPurchase[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">최근 구매</CardTitle>
      </CardHeader>
      <CardContent>
        {purchases.length === 0 ? (
          <p className="text-sm text-muted-foreground">구매 완료된 항목이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {purchases.map((purchase) => (
              <li key={purchase.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  {purchase.title} <span className="text-xs text-muted-foreground">· {purchase.requestNumber}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  {purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleDateString("ko-KR") : "-"}
                  <span className="font-medium text-foreground">{formatCurrency(purchase.finalCost)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
