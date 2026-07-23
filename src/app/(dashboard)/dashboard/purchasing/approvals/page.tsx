import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { canManagePurchasing } from "@/lib/purchasing/permissions";
import { listPurchaseRequests, type PurchaseSortField } from "@/services/purchase-service";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PurchaseFilters } from "@/components/purchasing/purchase-filters";
import { PurchaseRequestTable } from "@/components/purchasing/purchase-request-table";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";
import type { PurchasePriority } from "@/types/database.types";

export const metadata: Metadata = {
  title: "승인 대기 | SKID",
};

const SORT_FIELDS: PurchaseSortField[] = ["requested_at", "estimated_cost", "final_cost", "status"];

interface ApprovalsPageSearchParams {
  search?: string;
  priority?: string;
  sortField?: string;
  sortDirection?: string;
  page?: string;
  [key: string]: string | undefined;
}

export default async function PendingApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<ApprovalsPageSearchParams>;
}) {
  const profile = await requireUser();

  if (!canManagePurchasing(profile)) {
    redirect("/dashboard/purchasing");
  }

  const query = await searchParams;

  const priority = ["low", "normal", "high", "urgent"].includes(query.priority ?? "")
    ? (query.priority as PurchasePriority)
    : undefined;
  const sortField = SORT_FIELDS.includes(query.sortField as PurchaseSortField) ? (query.sortField as PurchaseSortField) : undefined;
  const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";
  const page = query.page ? Number(query.page) : 1;

  const requestsResult = await listPurchaseRequests({
    search: query.search,
    status: "pending_approval",
    priority,
    sortField: sortField ?? "requested_at",
    sortDirection: sortDirection ?? "asc",
    page,
  });

  return (
    <div className="flex flex-col gap-4">
      <VehicleBreadcrumb items={[{ label: "Purchasing", href: "/dashboard/purchasing" }, { label: "승인 대기" }]} />

      <div>
        <h2 className="text-2xl font-semibold tracking-tight">승인 대기</h2>
        <p className="text-sm text-muted-foreground">Treasurer의 승인을 기다리고 있는 구매 요청입니다.</p>
      </div>

      <PurchaseFilters />

      <PurchaseRequestTable requests={requestsResult.requests} />

      <PaginationControls
        basePath="/dashboard/purchasing/approvals"
        page={requestsResult.page}
        pageSize={requestsResult.pageSize}
        total={requestsResult.total}
        searchParams={query}
      />
    </div>
  );
}
