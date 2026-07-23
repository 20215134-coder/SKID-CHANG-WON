import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/require-user";
import { listPurchaseRequests, type PurchaseSortField } from "@/services/purchase-service";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PurchaseFilters } from "@/components/purchasing/purchase-filters";
import { PurchaseRequestTable } from "@/components/purchasing/purchase-request-table";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";
import type { PurchasePriority, PurchaseStatus } from "@/types/database.types";

export const metadata: Metadata = {
  title: "구매 이력 | FSAE ERP",
};

const SORT_FIELDS: PurchaseSortField[] = ["requested_at", "estimated_cost", "final_cost", "status"];
const HISTORY_STATUSES: PurchaseStatus[] = ["purchased", "rejected", "cancelled"];

interface HistoryPageSearchParams {
  search?: string;
  status?: string;
  priority?: string;
  sortField?: string;
  sortDirection?: string;
  page?: string;
  [key: string]: string | undefined;
}

export default async function PurchaseHistoryPage({
  searchParams,
}: {
  searchParams: Promise<HistoryPageSearchParams>;
}) {
  await requireUser();
  const query = await searchParams;

  const status = HISTORY_STATUSES.includes(query.status as PurchaseStatus) ? (query.status as PurchaseStatus) : undefined;
  const priority = ["low", "normal", "high", "urgent"].includes(query.priority ?? "")
    ? (query.priority as PurchasePriority)
    : undefined;
  const sortField = SORT_FIELDS.includes(query.sortField as PurchaseSortField) ? (query.sortField as PurchaseSortField) : undefined;
  const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";
  const page = query.page ? Number(query.page) : 1;

  const requestsResult = await listPurchaseRequests({
    search: query.search,
    status,
    statuses: status ? undefined : HISTORY_STATUSES,
    priority,
    sortField,
    sortDirection,
    page,
  });

  return (
    <div className="flex flex-col gap-4">
      <VehicleBreadcrumb items={[{ label: "Purchasing", href: "/dashboard/purchasing" }, { label: "구매 이력" }]} />

      <div>
        <h2 className="text-2xl font-semibold tracking-tight">구매 이력</h2>
        <p className="text-sm text-muted-foreground">구매 완료, 반려, 취소된 요청 목록입니다.</p>
      </div>

      <PurchaseFilters statusOptions={HISTORY_STATUSES} />

      <PurchaseRequestTable requests={requestsResult.requests} />

      <PaginationControls
        basePath="/dashboard/purchasing/history"
        page={requestsResult.page}
        pageSize={requestsResult.pageSize}
        total={requestsResult.total}
        searchParams={query}
      />
    </div>
  );
}
