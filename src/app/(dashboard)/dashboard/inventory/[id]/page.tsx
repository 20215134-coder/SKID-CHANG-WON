import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { canManageInventoryItem } from "@/lib/inventory/permissions";
import { BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { INVENTORY_CATEGORY_LABELS } from "@/lib/inventory/constants";
import { listBomPartOptions } from "@/services/bom-service";
import { getInventoryItem, listInventoryMovements } from "@/services/inventory-service";
import { InventoryRowActions } from "@/components/inventory/inventory-row-actions";
import { InventoryStatusBadge } from "@/components/inventory/inventory-status-badge";
import { MovementHistoryTable } from "@/components/inventory/movement-history-table";
import { Card, CardContent } from "@/components/ui/card";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";

function formatCurrency(amount: number | null): string {
  if (amount === null) return "-";
  return `${amount.toLocaleString("ko-KR")}원`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getInventoryItem(id);
  return { title: `${item?.itemCode ?? "재고 항목"} | FSAE ERP` };
}

export default async function InventoryItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireUser();
  const { id } = await params;

  const item = await getInventoryItem(id);
  if (!item) notFound();

  const [movements, partOptions] = await Promise.all([
    listInventoryMovements({ inventoryItemId: id, pageSize: 20 }),
    listBomPartOptions(),
  ]);

  const canManage = canManageInventoryItem(profile, item);
  const canSeeValue = profile.role === "admin" || profile.isTreasurer;

  return (
    <div className="flex flex-col gap-4">
      <VehicleBreadcrumb items={[{ label: "Inventory", href: "/dashboard/inventory" }, { label: item.itemCode }]} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{item.itemName}</h2>
          <p className="text-sm text-muted-foreground">{item.itemCode}</p>
        </div>
        {canManage ? (
          <InventoryRowActions
            item={item}
            partOptions={partOptions}
            canDelete={profile.role === "admin"}
            canAdjust={profile.role === "admin"}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <InventoryStatusBadge status={item.status} />
      </div>

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">카테고리</p>
            <p className="text-sm">{INVENTORY_CATEGORY_LABELS[item.category]}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">수량</p>
            <p className="text-sm">
              {item.currentQuantity} / {item.minimumQuantity} {item.unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">제조사</p>
            <p className="text-sm">{item.manufacturer ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">공급업체</p>
            <p className="text-sm">{item.supplier ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">보관 위치</p>
            <p className="text-sm">{item.storageLocation ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">소속 부서</p>
            <p className="text-sm">{item.owningDepartment ?? "-"}</p>
          </div>
          {canSeeValue ? (
            <div>
              <p className="text-xs text-muted-foreground">단가 / 자산 가치</p>
              <p className="text-sm">
                {formatCurrency(item.unitCost)} / {formatCurrency(item.totalAssetValue)}
              </p>
            </div>
          ) : null}
          <div>
            <p className="text-xs text-muted-foreground">연결된 BOM Part</p>
            {item.relatedPartId ? (
              <p className="text-sm">
                {item.relatedPartNumber} · {item.relatedPartName}
                {item.relatedPartCategory ? ` (${BOM_CATEGORY_LABELS[item.relatedPartCategory]})` : ""}
              </p>
            ) : (
              <p className="text-sm">-</p>
            )}
          </div>
          {item.description ? (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">설명</p>
              <p className="text-sm whitespace-pre-wrap">{item.description}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3 className="mb-3 text-sm font-semibold">이동 이력</h3>
          <MovementHistoryTable entries={movements.entries} />
        </CardContent>
      </Card>
    </div>
  );
}
