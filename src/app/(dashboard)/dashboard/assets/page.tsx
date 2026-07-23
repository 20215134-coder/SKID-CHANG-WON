import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/require-user";
import { listAssets } from "@/services/asset-service";
import { listActiveMemberOptions } from "@/services/team-service";
import { ASSET_CONDITIONS } from "@/lib/assets/constants";
import { BOM_CATEGORIES } from "@/lib/bom/constants";
import { AssetFilters } from "@/components/assets/asset-filters";
import { AssetTable } from "@/components/assets/asset-table";
import { CreateAssetButton } from "@/components/assets/create-asset-button";
import { PaginationControls } from "@/components/ui/pagination-controls";
import type { AssetCondition, BomCategory } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Assets | FSAE ERP",
};

interface AssetsPageSearchParams {
  search?: string;
  condition?: string;
  category?: string;
  page?: string;
  [key: string]: string | undefined;
}

export default async function AssetsPage({ searchParams }: { searchParams: Promise<AssetsPageSearchParams> }) {
  const profile = await requireUser();
  const query = await searchParams;

  const condition = ASSET_CONDITIONS.includes(query.condition as AssetCondition) ? (query.condition as AssetCondition) : undefined;
  const category = BOM_CATEGORIES.includes(query.category as BomCategory) ? (query.category as BomCategory) : undefined;
  const page = query.page ? Number(query.page) : 1;

  const [assetsResult, memberOptions] = await Promise.all([
    listAssets({ search: query.search, condition, category, page }),
    listActiveMemberOptions(),
  ]);

  const canManage = profile.role === "admin" || profile.role === "leader";
  const canSeeValue = profile.role === "admin" || profile.isTreasurer;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Assets</h2>
          <p className="text-sm text-muted-foreground">공구, 장비 등 팀이 재사용하는 자산 목록입니다.</p>
        </div>
        {canManage ? <CreateAssetButton memberOptions={memberOptions} /> : null}
      </div>

      <AssetFilters />

      <AssetTable
        assets={assetsResult.assets}
        memberOptions={memberOptions}
        canManage={canManage}
        canDelete={profile.role === "admin"}
        canSeeValue={canSeeValue}
      />

      <PaginationControls
        basePath="/dashboard/assets"
        page={assetsResult.page}
        pageSize={assetsResult.pageSize}
        total={assetsResult.total}
        searchParams={query}
      />
    </div>
  );
}
