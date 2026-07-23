import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { getCategory, getVehicle } from "@/services/vehicle-service";
import { getSubsystem } from "@/services/subsystem-service";
import { getAssembly, getAssemblyStats } from "@/services/assembly-service";
import { listAssemblyFiles } from "@/services/assembly-file-service";
import { listAssemblyFasteners, listFastenerOptions } from "@/services/fastener-service";
import { listActiveMemberOptions } from "@/services/team-service";
import { listInventoryItemOptions } from "@/services/inventory-service";
import { listAssetOptions } from "@/services/asset-service";
import { getAssemblyMaterialCost, listParts, type BomSortField } from "@/services/bom-service";
import { BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { AssemblyFastenersSection } from "@/components/fasteners/assembly-fasteners-section";
import { AssemblyFilesSection } from "@/components/assembly-files/assembly-files-section";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { CreatePartButton } from "@/components/bom/create-part-button";
import { PartFilters } from "@/components/bom/part-filters";
import { PartTable } from "@/components/bom/part-table";
import { EditAssemblyButton } from "@/components/vehicle/edit-assembly-button";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";
import type { ManufacturingStatus } from "@/types/database.types";

const SORT_FIELDS: BomSortField[] = ["part_name", "revision", "updated_at"];
const STATUS_VALUES: ManufacturingStatus[] = [
  "designing",
  "ready_for_manufacturing",
  "manufacturing",
  "inspection",
  "assembly",
  "completed",
];

interface AssemblyPageSearchParams {
  search?: string;
  status?: string;
  sortField?: string;
  sortDirection?: string;
  page?: string;
  [key: string]: string | undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ assemblyId: string }>;
}): Promise<Metadata> {
  const { assemblyId } = await params;
  const assembly = await getAssembly(assemblyId);
  return { title: `${assembly?.name ?? "Assembly"} | FSAE ERP` };
}

export default async function AssemblyPage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string; assemblyId: string }>;
  searchParams: Promise<AssemblyPageSearchParams>;
}) {
  const profile = await requireUser();
  const { vehicleId, assemblyId } = await params;
  const query = await searchParams;

  const [vehicle, assembly] = await Promise.all([getVehicle(vehicleId), getAssembly(assemblyId)]);
  if (!vehicle || !assembly) notFound();

  const subsystem = await getSubsystem(assembly.subsystemId);
  if (!subsystem) notFound();
  const category = await getCategory(subsystem.categoryId);
  if (!category || category.vehicleId !== vehicleId) notFound();

  const status = STATUS_VALUES.includes(query.status as ManufacturingStatus)
    ? (query.status as ManufacturingStatus)
    : undefined;
  const sortField = SORT_FIELDS.includes(query.sortField as BomSortField) ? (query.sortField as BomSortField) : undefined;
  const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";
  const page = query.page ? Number(query.page) : 1;

  const [stats, partsResult, memberOptions, itemOptions, assetOptions, assemblyFasteners, fastenerOptions, assemblyFiles, materialCost] =
    await Promise.all([
      getAssemblyStats(assemblyId),
      listParts({ assemblyId, search: query.search, status, sortField, sortDirection, page }),
      listActiveMemberOptions(),
      listInventoryItemOptions(),
      listAssetOptions(),
      listAssemblyFasteners(assemblyId),
      listFastenerOptions(),
      listAssemblyFiles(assemblyId),
      getAssemblyMaterialCost(assemblyId),
    ]);

  const canManage = profile.role === "admin" || (profile.role === "leader" && profile.bomCategory === category.name);
  const basePath = `/dashboard/vehicle/${vehicleId}/assemblies/${assemblyId}`;

  return (
    <div className="flex flex-col gap-4">
      <VehicleBreadcrumb
        items={[
          { label: "Vehicle", href: "/dashboard/vehicle" },
          { label: vehicle.vehicleName, href: `/dashboard/vehicle/${vehicleId}` },
          { label: BOM_CATEGORY_LABELS[category.name], href: `/dashboard/vehicle/${vehicleId}/categories/${category.id}` },
          { label: subsystem.name, href: `/dashboard/vehicle/${vehicleId}/subsystems/${subsystem.id}` },
          { label: assembly.name },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{assembly.name}</h2>
          <p className="text-sm text-muted-foreground">Rev {assembly.revision}</p>
        </div>
        {canManage ? <EditAssemblyButton assembly={assembly} /> : null}
      </div>

      {assembly.description ? <p className="text-sm text-muted-foreground">{assembly.description}</p> : null}

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">부품 수</CardTitle>
            <CardDescription>{stats.partCount}개</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">총 무게</CardTitle>
            <CardDescription>{stats.totalWeight.toLocaleString()} g</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">제작 진행률</CardTitle>
            <CardDescription>
              {stats.progressPercent}% ({stats.completedCount}/{stats.partCount} 완료)
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">예상 자재비</CardTitle>
            <CardDescription>{materialCost.toLocaleString("ko-KR")}원</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">부품 목록 (BOM)</h3>
        {canManage ? (
          <CreatePartButton assemblyId={assemblyId} memberOptions={memberOptions} itemOptions={itemOptions} assetOptions={assetOptions} />
        ) : null}
      </div>

      <PartFilters />

      <PartTable
        vehicleId={vehicleId}
        parts={partsResult.parts}
        canManage={canManage}
        actingProfile={profile}
        memberOptions={memberOptions}
        itemOptions={itemOptions}
        assetOptions={assetOptions}
      />

      <PaginationControls
        basePath={basePath}
        page={partsResult.page}
        pageSize={partsResult.pageSize}
        total={partsResult.total}
        searchParams={query}
      />

      <AssemblyFastenersSection
        assemblyId={assemblyId}
        fasteners={assemblyFasteners}
        fastenerOptions={fastenerOptions}
        canManage={canManage}
      />

      <AssemblyFilesSection assemblyId={assemblyId} files={assemblyFiles} canManage={canManage} />
    </div>
  );
}
