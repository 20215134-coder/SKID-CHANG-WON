import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/require-user";
import { listInventoryMovements } from "@/services/inventory-service";
import { MovementHistoryTable } from "@/components/inventory/movement-history-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";

export const metadata: Metadata = {
  title: "이동 이력 | SKID",
};

interface HistoryPageSearchParams {
  page?: string;
  [key: string]: string | undefined;
}

export default async function InventoryHistoryPage({ searchParams }: { searchParams: Promise<HistoryPageSearchParams> }) {
  await requireUser();
  const query = await searchParams;
  const page = query.page ? Number(query.page) : 1;

  const result = await listInventoryMovements({ page });

  return (
    <div className="flex flex-col gap-4">
      <VehicleBreadcrumb items={[{ label: "Inventory", href: "/dashboard/inventory" }, { label: "이동 이력" }]} />

      <div>
        <h2 className="text-2xl font-semibold tracking-tight">이동 이력</h2>
        <p className="text-sm text-muted-foreground">입고/출고/조정/이동 전체 이력입니다.</p>
      </div>

      <MovementHistoryTable entries={result.entries} />

      <PaginationControls
        basePath="/dashboard/inventory/history"
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        searchParams={query}
      />
    </div>
  );
}
