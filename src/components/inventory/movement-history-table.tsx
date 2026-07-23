import Link from "next/link";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MovementTypeBadge } from "@/components/inventory/movement-type-badge";
import type { InventoryMovementEntry } from "@/services/inventory-service";

export function MovementHistoryTable({ entries }: { entries: InventoryMovementEntry[] }) {
  if (entries.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">이동 이력이 없습니다.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>품목</TableHead>
          <TableHead>유형</TableHead>
          <TableHead>수량 변화</TableHead>
          <TableHead>사유</TableHead>
          <TableHead>처리자</TableHead>
          <TableHead>일시</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="font-medium">
              <Link href={`/dashboard/inventory/${entry.inventoryItemId}`} className="hover:underline">
                {entry.itemCode} · {entry.itemName}
              </Link>
            </TableCell>
            <TableCell>
              <MovementTypeBadge movementType={entry.movementType} />
            </TableCell>
            <TableCell>
              {entry.previousQuantity} → {entry.newQuantity}
            </TableCell>
            <TableCell className="max-w-64 truncate">{entry.reason ?? "-"}</TableCell>
            <TableCell>{entry.performedByName ?? "-"}</TableCell>
            <TableCell>{new Date(entry.createdAt).toLocaleString("ko-KR")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
