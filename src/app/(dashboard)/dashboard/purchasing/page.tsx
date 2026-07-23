import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/require-user";
import { listPurchaseRequests, type PurchaseSortField } from "@/services/purchase-service";
import {
  getPurchaseDashboardSummary,
  listRecentPurchases,
  listTopSpendingCategories,
  listTopSuppliers,
} from "@/services/purchase-dashboard-service";
import { PURCHASE_STATUSES } from "@/lib/purchasing/constants";
import { CreatePurchaseRequestButton } from "@/components/purchasing/create-purchase-request-button";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PurchaseDashboardWidgets } from "@/components/purchasing/purchase-dashboard-widgets";
import { PurchaseFilters } from "@/components/purchasing/purchase-filters";
import { PurchaseRequestTable } from "@/components/purchasing/purchase-request-table";
import type { PurchasePriority, PurchaseStatus } from "@/types/database.types";

export const metadata: Metadata = {
  title: "구매 요청 | FSAE ERP",
};

const SORT_FIELDS: PurchaseSortField[] = ["requested_at", "estimated_cost", "final_cost", "status"];

interface PurchasingPageSearchParams {
  search?: string;
  status?: string;
  priority?: string;
  sortField?: string;
  sortDirection?: string;
  page?: string;
  [key: string]: string | undefined;
}

export default async function PurchasingPage({
  searchParams,
}: {
  searchParams: Promise<PurchasingPageSearchParams>;
}) {
  await requireUser();
  const query = await searchParams;

  const status = PURCHASE_STATUSES.includes(query.status as PurchaseStatus) ? (query.status as PurchaseStatus) : undefined;
  const priority = ["low", "normal", "high", "urgent"].includes(query.priority ?? "")
    ? (query.priority as PurchasePriority)
    : undefined;
  const sortField = SORT_FIELDS.includes(query.sortField as PurchaseSortField) ? (query.sortField as PurchaseSortField) : undefined;
  const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";
  const page = query.page ? Number(query.page) : 1;

  const [summary, recentPurchases, topCategories, topSuppliers, requestsResult] = await Promise.all([
    getPurchaseDashboardSummary(),
    listRecentPurchases(),
    listTopSpendingCategories(),
    listTopSuppliers(),
    listPurchaseRequests({ search: query.search, status, priority, sortField, sortDirection, page }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PurchaseDashboardWidgets
        summary={summary}
        recentPurchases={recentPurchases}
        topCategories={topCategories}
        topSuppliers={topSuppliers}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">구매 요청</h2>
          <CreatePurchaseRequestButton />
        </div>

        <PurchaseFilters statusOptions={PURCHASE_STATUSES} />

        <PurchaseRequestTable requests={requestsResult.requests} />

        <PaginationControls
          basePath="/dashboard/purchasing"
          page={requestsResult.page}
          pageSize={requestsResult.pageSize}
          total={requestsResult.total}
          searchParams={query}
        />
      </div>
    </div>
  );
}
