import Link from "next/link";

import { canManageInventoryItem } from "@/lib/inventory/permissions";
import { INVENTORY_CATEGORY_LABELS } from "@/lib/inventory/constants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InventoryRowActions } from "@/components/inventory/inventory-row-actions";
import { InventoryStatusBadge } from "@/components/inventory/inventory-status-badge";
import type { BomPartOption } from "@/services/bom-service";
import type { InventoryItem } from "@/services/inventory-service";
import type { AuthProfile } from "@/types/auth";

function formatCurrency(amount: number | null): string {
  if (amount === null) return "-";
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function InventoryTable({
  items,
  partOptions,
  actingProfile,
  canSeeValue,
}: {
  items: InventoryItem[];
  partOptions: BomPartOption[];
  actingProfile: Pick<AuthProfile, "role" | "bomCategory" | "department">;
  canSeeValue: boolean;
}) {
  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">조건에 맞는 재고 항목이 없습니다.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>품목 코드</TableHead>
          <TableHead>품목명</TableHead>
          <TableHead>카테고리</TableHead>
          <TableHead>수량</TableHead>
          <TableHead>보관 위치</TableHead>
          <TableHead>상태</TableHead>
          {canSeeValue ? <TableHead>자산 가치</TableHead> : null}
          <TableHead>수정일</TableHead>
          <TableHead className="text-right">작업</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const canManage = canManageInventoryItem(actingProfile, item);
          return (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <Link href={`/dashboard/inventory/${item.id}`} className="hover:underline">
                  {item.itemCode}
                </Link>
              </TableCell>
              <TableCell>{item.itemName}</TableCell>
              <TableCell>{INVENTORY_CATEGORY_LABELS[item.category]}</TableCell>
              <TableCell>
                {item.currentQuantity} / {item.minimumQuantity} {item.unit}
              </TableCell>
              <TableCell>{item.storageLocation ?? "-"}</TableCell>
              <TableCell>
                <InventoryStatusBadge status={item.status} />
              </TableCell>
              {canSeeValue ? <TableCell>{formatCurrency(item.totalAssetValue)}</TableCell> : null}
              <TableCell>{new Date(item.updatedAt).toLocaleDateString("ko-KR")}</TableCell>
              <TableCell className="text-right">
                {canManage ? (
                  <InventoryRowActions
                    item={item}
                    partOptions={partOptions}
                    canDelete={actingProfile.role === "admin"}
                    canAdjust={actingProfile.role === "admin"}
                  />
                ) : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
