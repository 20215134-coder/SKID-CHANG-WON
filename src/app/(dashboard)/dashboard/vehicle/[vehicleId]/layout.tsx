import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { getVehicle } from "@/services/vehicle-service";
import { getVehicleTree } from "@/services/vehicle-tree-service";
import { VehicleTree } from "@/components/vehicle/vehicle-tree";

export default async function VehicleDetailLayout({
  params,
  children,
}: {
  params: Promise<{ vehicleId: string }>;
  children: React.ReactNode;
}) {
  await requireUser();
  const { vehicleId } = await params;

  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) notFound();

  const tree = await getVehicleTree(vehicleId);

  return (
    <div className="flex flex-1 gap-4">
      <aside className="hidden w-72 shrink-0 self-start rounded-lg border bg-card p-3 lg:sticky lg:top-4 lg:block">
        <div className="mb-2 truncate px-1 text-sm font-semibold">{vehicle.vehicleName}</div>
        <VehicleTree vehicleId={vehicleId} categories={tree} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
