import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/require-user";
import { listBomPartOptions } from "@/services/bom-service";
import { getInventoryDashboardStats } from "@/services/inventory-dashboard-service";
import { listInventoryItems, listStorageLocations, type InventorySortField } from "@/services/inventory-service";
import { INVENTORY_CATEGORIES, INVENTORY_ITEM_STATUSES } from "@/lib/inventory/constants";
import { CreateInventoryButton } from "@/components/inventory/create-inventory-button";
import { InventoryDashboardWidgets } from "@/components/inventory/inventory-dashboard-widgets";
import { InventoryFilters } from "@/components/inventory/inventory-filters";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import type { InventoryCategory, InventoryItemStatus } from "@/types/database.types";

export const metadata: Metadata = {
  title: "재고 관리 | SKID",
};

const SORT_FIELDS: InventorySortField[] = ["item_name", "current_quantity", "updated_at"];

interface InventoryPageSearchParams {
  search?: string;
  category?: string;
  status?: string;
  storageLocation?: string;
  sortField?: string;
  sortDirection?: string;
  page?: string;
  [key: string]: string | undefined;
}

export default async function InventoryPage({ searchParams }: { searchParams: Promise<InventoryPageSearchParams> }) {
  const profile = await requireUser();
  const query = await searchParams;

  const category = INVENTORY_CATEGORIES.includes(query.category as InventoryCategory) ? (query.category as InventoryCategory) : undefined;
  const status = INVENTORY_ITEM_STATUSES.includes(query.status as InventoryItemStatus)
    ? (query.status as InventoryItemStatus)
    : undefined;
  const sortField = SORT_FIELDS.includes(query.sortField as InventorySortField) ? (query.sortField as InventorySortField) : undefined;
  const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";
  const page = query.page ? Number(query.page) : 1;

  const [stats, itemsResult, storageLocations, partOptions] = await Promise.all([
    getInventoryDashboardStats(),
    listInventoryItems({
      search: query.search,
      category,
      status,
      storageLocation: query.storageLocation,
      sortField,
      sortDirection,
      page,
    }),
    listStorageLocations(),
    listBomPartOptions(),
  ]);

  const canManage = profile.role !== "member";
  const canSeeValue = profile.role === "admin" || profile.isTreasurer;

  return (
    <div className="flex flex-col gap-6">
      <InventoryDashboardWidgets stats={stats} canSeeValue={canSeeValue} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">재고 항목</h2>
          {canManage ? <CreateInventoryButton partOptions={partOptions} /> : null}
        </div>

        <InventoryFilters storageLocations={storageLocations} />

        <InventoryTable items={itemsResult.items} partOptions={partOptions} actingProfile={profile} canSeeValue={canSeeValue} />

        <PaginationControls
          basePath="/dashboard/inventory"
          page={itemsResult.page}
          pageSize={itemsResult.pageSize}
          total={itemsResult.total}
          searchParams={query}
        />
      </div>
    </div>
  );
}
