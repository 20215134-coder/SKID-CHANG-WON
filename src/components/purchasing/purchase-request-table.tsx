import Link from "next/link";

import { BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { formatCurrency } from "@/lib/purchasing/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PurchaseStatusBadge } from "@/components/purchasing/purchase-status-badge";
import type { PurchaseRequest } from "@/services/purchase-service";

export function PurchaseRequestTable({ requests }: { requests: PurchaseRequest[] }) {
  if (requests.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">조건에 맞는 구매 요청이 없습니다.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>요청 번호</TableHead>
          <TableHead>제목</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Subsystem</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>예상 비용</TableHead>
          <TableHead>최종 비용</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>요청자</TableHead>
          <TableHead>Treasurer</TableHead>
          <TableHead>구매일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell className="font-medium">
              <Link href={`/dashboard/purchasing/${request.id}`} className="hover:underline">
                {request.requestNumber}
              </Link>
            </TableCell>
            <TableCell className="max-w-48 truncate">{request.title}</TableCell>
            <TableCell>{request.vehicleName}</TableCell>
            <TableCell>{BOM_CATEGORY_LABELS[request.categoryName]}</TableCell>
            <TableCell>{request.subsystemName ?? "-"}</TableCell>
            <TableCell>{request.supplier ?? "-"}</TableCell>
            <TableCell>{formatCurrency(request.estimatedCost)}</TableCell>
            <TableCell>{formatCurrency(request.finalCost)}</TableCell>
            <TableCell>
              <PurchaseStatusBadge status={request.status} />
            </TableCell>
            <TableCell>{request.requestedByName ?? "-"}</TableCell>
            <TableCell>{request.purchasedByName ?? request.approvedByName ?? "-"}</TableCell>
            <TableCell>{request.purchasedAt ? new Date(request.purchasedAt).toLocaleDateString("ko-KR") : "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
