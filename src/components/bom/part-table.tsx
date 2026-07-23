import Link from "next/link";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ManufacturingStatusBadge } from "@/components/bom/manufacturing-status-badge";
import { PartRowActions } from "@/components/bom/part-row-actions";
import type { BomPart } from "@/services/bom-service";
import type { AssetOption } from "@/services/asset-service";
import type { InventoryItemOption } from "@/services/inventory-service";
import type { MemberOption } from "@/services/team-service";
import type { AuthProfile } from "@/types/auth";

export function PartTable({
  vehicleId,
  parts,
  canManage,
  actingProfile,
  memberOptions,
  itemOptions,
  assetOptions,
}: {
  vehicleId: string;
  parts: BomPart[];
  canManage: boolean;
  actingProfile: Pick<AuthProfile, "role" | "bomCategory">;
  memberOptions: MemberOption[];
  itemOptions: InventoryItemOption[];
  assetOptions: AssetOption[];
}) {
  if (parts.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">조건에 맞는 부품이 없습니다.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Part Number</TableHead>
          <TableHead>Part Name</TableHead>
          <TableHead>Rev</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>자재비</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">작업</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {parts.map((part) => (
          <TableRow key={part.id}>
            <TableCell className="font-medium">
              <Link href={`/dashboard/vehicle/${vehicleId}/parts/${part.id}`} className="hover:underline">
                {part.partNumber}
              </Link>
            </TableCell>
            <TableCell>{part.partName}</TableCell>
            <TableCell>{part.revision}</TableCell>
            <TableCell>
              <ManufacturingStatusBadge status={part.manufacturingStatus} />
            </TableCell>
            <TableCell>{part.ownerName ?? "-"}</TableCell>
            <TableCell className="text-muted-foreground">
              {part.materialCost !== null ? `${part.materialCost.toLocaleString("ko-KR")}원` : "-"}
            </TableCell>
            <TableCell>{new Date(part.updatedAt).toLocaleDateString("ko-KR")}</TableCell>
            <TableCell className="text-right">
              {canManage ? (
                <PartRowActions
                  part={part}
                  actingProfile={actingProfile}
                  memberOptions={memberOptions}
                  itemOptions={itemOptions}
                  assetOptions={assetOptions}
                />
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
