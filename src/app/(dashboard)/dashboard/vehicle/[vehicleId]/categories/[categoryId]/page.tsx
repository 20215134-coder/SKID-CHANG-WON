import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { getCategory, getVehicle } from "@/services/vehicle-service";
import { listSubsystems } from "@/services/subsystem-service";
import { listAssemblies } from "@/services/assembly-service";
import { BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateSubsystemButton } from "@/components/vehicle/create-subsystem-button";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vehicleId: string; categoryId: string }>;
}): Promise<Metadata> {
  const { categoryId } = await params;
  const category = await getCategory(categoryId);
  return { title: `${category ? BOM_CATEGORY_LABELS[category.name] : "Category"} | SKID` };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ vehicleId: string; categoryId: string }>;
}) {
  const profile = await requireUser();
  const { vehicleId, categoryId } = await params;

  const [vehicle, category, subsystems] = await Promise.all([
    getVehicle(vehicleId),
    getCategory(categoryId),
    listSubsystems(categoryId),
  ]);
  if (!vehicle || !category || category.vehicleId !== vehicleId) notFound();

  const assemblyCounts = await Promise.all(
    subsystems.map(async (subsystem) => ({ id: subsystem.id, count: (await listAssemblies(subsystem.id)).length })),
  );
  const countMap = new Map(assemblyCounts.map((entry) => [entry.id, entry.count]));

  const canManage = profile.role === "admin" || (profile.role === "leader" && profile.bomCategory === category.name);

  return (
    <div className="flex flex-col gap-4">
      <VehicleBreadcrumb
        items={[
          { label: "Vehicle", href: "/dashboard/vehicle" },
          { label: vehicle.vehicleName, href: `/dashboard/vehicle/${vehicleId}` },
          { label: BOM_CATEGORY_LABELS[category.name] },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">{BOM_CATEGORY_LABELS[category.name]}</h2>
        {canManage ? <CreateSubsystemButton categoryId={categoryId} /> : null}
      </div>

      {subsystems.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">등록된 Subsystem이 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subsystems.map((subsystem) => (
            <Link key={subsystem.id} href={`/dashboard/vehicle/${vehicleId}/subsystems/${subsystem.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{subsystem.name}</CardTitle>
                  <CardDescription>{countMap.get(subsystem.id) ?? 0}개 Assembly</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
