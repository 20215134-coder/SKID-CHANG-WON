import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { getCategory, getVehicle } from "@/services/vehicle-service";
import { getSubsystem } from "@/services/subsystem-service";
import { getAssembly } from "@/services/assembly-service";
import { getPart, listPartRevisions } from "@/services/bom-service";
import { listCurrentPartFiles } from "@/services/part-file-service";
import { listActiveMemberOptions } from "@/services/team-service";
import { listInventoryItemOptions } from "@/services/inventory-service";
import { listAssetOptions } from "@/services/asset-service";
import { BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { EngineeringFilesTab } from "@/components/part-files/engineering-files-tab";
import { ManufacturingStatusBadge } from "@/components/bom/manufacturing-status-badge";
import { PartOverviewActions } from "@/components/vehicle/part-overview-actions";
import { RevisionTimeline } from "@/components/bom/revision-timeline";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";

const FUTURE_TABS = ["Inventory", "Purchasing", "Manufacturing", "Testing", "Documents", "SES"];

export async function generateMetadata({ params }: { params: Promise<{ partId: string }> }): Promise<Metadata> {
  const { partId } = await params;
  const part = await getPart(partId);
  return { title: `${part?.partNumber ?? "Part"} | SKID` };
}

export default async function PartDetailPage({
  params,
}: {
  params: Promise<{ vehicleId: string; partId: string }>;
}) {
  const profile = await requireUser();
  const { vehicleId, partId } = await params;

  const [vehicle, part] = await Promise.all([getVehicle(vehicleId), getPart(partId)]);
  if (!vehicle || !part) notFound();

  const assembly = await getAssembly(part.assemblyId);
  if (!assembly) notFound();
  const subsystem = await getSubsystem(assembly.subsystemId);
  if (!subsystem) notFound();
  const category = await getCategory(subsystem.categoryId);
  if (!category || category.vehicleId !== vehicleId) notFound();

  const [revisions, files, memberOptions, itemOptions, assetOptions] = await Promise.all([
    listPartRevisions(partId),
    listCurrentPartFiles(partId),
    listActiveMemberOptions(),
    listInventoryItemOptions(),
    listAssetOptions(),
  ]);

  const canManage = profile.role === "admin" || (profile.role === "leader" && profile.bomCategory === category.name);

  return (
    <div className="flex flex-col gap-4">
      <VehicleBreadcrumb
        items={[
          { label: "Vehicle", href: "/dashboard/vehicle" },
          { label: vehicle.vehicleName, href: `/dashboard/vehicle/${vehicleId}` },
          { label: BOM_CATEGORY_LABELS[category.name], href: `/dashboard/vehicle/${vehicleId}/categories/${category.id}` },
          { label: subsystem.name, href: `/dashboard/vehicle/${vehicleId}/subsystems/${subsystem.id}` },
          { label: assembly.name, href: `/dashboard/vehicle/${vehicleId}/assemblies/${assembly.id}` },
          { label: part.partName },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{part.partName}</h2>
          <p className="text-sm text-muted-foreground">{part.partNumber}</p>
        </div>
        {canManage ? (
          <PartOverviewActions
            part={part}
            memberOptions={memberOptions}
            itemOptions={itemOptions}
            assetOptions={assetOptions}
            canDelete={profile.role === "admin"}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Rev {part.revision}</Badge>
        <ManufacturingStatusBadge status={part.manufacturingStatus} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revisions">Revision History</TabsTrigger>
          <TabsTrigger value="files">Engineering Files</TabsTrigger>
          <TabsTrigger value="cost">Cost</TabsTrigger>
          {FUTURE_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} disabled>
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Material</p>
                <p className="text-sm">{part.material ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Weight</p>
                <p className="text-sm">{part.weight != null ? `${part.weight} g` : "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Supplier</p>
                <p className="text-sm">{part.supplier ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Owner</p>
                <p className="text-sm">{part.ownerName ?? "미지정"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm whitespace-pre-wrap">{part.description ?? "-"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revisions">
          <Card>
            <CardContent>
              <RevisionTimeline revisions={revisions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardContent>
              <EngineeringFilesTab partId={partId} files={files} canManage={canManage} canDelete={profile.role === "admin"} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost">
          <Card>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">연결된 자재 출처</p>
                <p className="text-sm">
                  {part.inventoryItemCode
                    ? `[Inventory] ${part.inventoryItemCode} · ${part.inventoryItemName}`
                    : part.assetNumber
                      ? `[Asset] ${part.assetNumber} · ${part.assetName}`
                      : "연결된 자재 출처가 없습니다."}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">소요 수량</p>
                <p className="text-sm">{part.inventoryItemId || part.assetId ? part.materialQuantity : "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">단가</p>
                <p className="text-sm">{part.materialUnitCost !== null ? `${part.materialUnitCost.toLocaleString("ko-KR")}원` : "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">예상 자재비</p>
                <p className="text-sm font-medium">
                  {part.materialCost !== null ? `${part.materialCost.toLocaleString("ko-KR")}원` : "-"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {FUTURE_TABS.map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {tab} 기능은 준비 중입니다.
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
