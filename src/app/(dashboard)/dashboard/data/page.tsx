import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/require-user";
import { listDataCategories, listDataEntries } from "@/services/data-entry-service";
import { listVehicles } from "@/services/vehicle-service";
import { CreateDataEntryButton } from "@/components/data-entries/create-data-entry-button";
import { DataCategoryFilter } from "@/components/data-entries/data-category-filter";
import { DataEntryCard } from "@/components/data-entries/data-entry-card";

export const metadata: Metadata = {
  title: "Data | SKID",
};

interface DataPageSearchParams {
  search?: string;
  category?: string;
}

export default async function DataPage({ searchParams }: { searchParams: Promise<DataPageSearchParams> }) {
  const profile = await requireUser();
  const query = await searchParams;

  const [entries, categories, vehicles] = await Promise.all([
    listDataEntries({ search: query.search, category: query.category }),
    listDataCategories(),
    listVehicles(),
  ]);

  const canManage = profile.role !== "member";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Data</h2>
          <p className="text-sm text-muted-foreground">차량 제원, 부품 사양 등 팀 내부 엔지니어링 참조 데이터입니다.</p>
        </div>
        {canManage ? <CreateDataEntryButton categories={categories} vehicles={vehicles} /> : null}
      </div>

      <DataCategoryFilter categories={categories} />

      {entries.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">등록된 데이터가 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <DataEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
