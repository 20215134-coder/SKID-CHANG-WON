import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { getVehicle } from "@/services/vehicle-service";
import { getVehicleTree } from "@/services/vehicle-tree-service";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";
import { VehicleTree } from "@/components/vehicle/vehicle-tree";

export async function generateMetadata({ params }: { params: Promise<{ vehicleId: string }> }): Promise<Metadata> {
  const { vehicleId } = await params;
  const vehicle = await getVehicle(vehicleId);
  return { title: `${vehicle?.vehicleName ?? "Vehicle"} Files | FSAE ERP` };
}

export default async function VehicleFilesPage({ params }: { params: Promise<{ vehicleId: string }> }) {
  await requireUser();
  const { vehicleId } = await params;

  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) notFound();

  const tree = await getVehicleTree(vehicleId);

  return (
    <div className="flex flex-col gap-4">
      <VehicleBreadcrumb items={[{ label: "Files", href: "/dashboard/files" }, { label: vehicle.vehicleName }]} />

      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{vehicle.vehicleName} Files</h2>
        <p className="text-sm text-muted-foreground">
          Assembly 또는 Part를 선택하면 해당 페이지의 첨부 파일 섹션으로 이동합니다.
        </p>
      </div>

      {tree.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">등록된 엔지니어링 구조가 없습니다.</p>
      ) : (
        <div className="max-w-xl rounded-lg border bg-card p-3">
          <VehicleTree vehicleId={vehicleId} categories={tree} />
        </div>
      )}
    </div>
  );
}
