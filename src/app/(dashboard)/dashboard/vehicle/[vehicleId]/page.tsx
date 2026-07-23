import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown } from "lucide-react";

import { requireUser } from "@/lib/auth/require-user";
import { getVehicle, listCategories } from "@/services/vehicle-service";
import { listSubsystems } from "@/services/subsystem-service";
import { getVehicleMaterialCost } from "@/services/bom-service";
import { BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";
import { VehicleStatusBadge } from "@/components/vehicle/vehicle-status-badge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}): Promise<Metadata> {
  const { vehicleId } = await params;
  const vehicle = await getVehicle(vehicleId);
  return { title: `${vehicle?.vehicleName ?? "Vehicle"} | FSAE ERP` };
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ vehicleId: string }> }) {
  await requireUser();
  const { vehicleId } = await params;

  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) notFound();

  const categories = await listCategories(vehicleId);
  const [subsystemCounts, materialCost] = await Promise.all([
    Promise.all(categories.map(async (category) => ({ id: category.id, count: (await listSubsystems(category.id)).length }))),
    getVehicleMaterialCost(vehicleId),
  ]);
  const subsystemCountMap = new Map(subsystemCounts.map((entry) => [entry.id, entry.count]));
  const costByCategory = new Map(materialCost.byCategory.map((entry) => [entry.category, entry.totalCost]));

  return (
    <div className="flex flex-col gap-4">
      <VehicleBreadcrumb items={[{ label: "Vehicle", href: "/dashboard/vehicle" }, { label: vehicle.vehicleName }]} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{vehicle.vehicleName}</h2>
          <p className="text-sm text-muted-foreground">{vehicle.competitionYear} 시즌</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<a href={`/api/vehicle/${vehicleId}/cost-report`} />} nativeButton={false}>
            <FileDown />
            비용보고서 다운로드
          </Button>
          <VehicleStatusBadge status={vehicle.status} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">예상 총 자재비</CardTitle>
          <CardDescription>{materialCost.totalCost.toLocaleString("ko-KR")}원</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link key={category.id} href={`/dashboard/vehicle/${vehicleId}/categories/${category.id}`}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>{BOM_CATEGORY_LABELS[category.name]}</CardTitle>
                <CardDescription>
                  {subsystemCountMap.get(category.id) ?? 0}개 Subsystem · {(costByCategory.get(category.name) ?? 0).toLocaleString("ko-KR")}원
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
