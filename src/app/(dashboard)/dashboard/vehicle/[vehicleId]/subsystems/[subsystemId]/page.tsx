import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { getCategory, getVehicle } from "@/services/vehicle-service";
import { getSubsystem } from "@/services/subsystem-service";
import { getAssemblyStats, listAssemblies } from "@/services/assembly-service";
import { BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateAssemblyButton } from "@/components/vehicle/create-assembly-button";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vehicleId: string; subsystemId: string }>;
}): Promise<Metadata> {
  const { subsystemId } = await params;
  const subsystem = await getSubsystem(subsystemId);
  return { title: `${subsystem?.name ?? "Subsystem"} | FSAE ERP` };
}

export default async function SubsystemPage({
  params,
}: {
  params: Promise<{ vehicleId: string; subsystemId: string }>;
}) {
  const profile = await requireUser();
  const { vehicleId, subsystemId } = await params;

  const [vehicle, subsystem, assemblies] = await Promise.all([
    getVehicle(vehicleId),
    getSubsystem(subsystemId),
    listAssemblies(subsystemId),
  ]);
  if (!vehicle || !subsystem) notFound();

  const category = await getCategory(subsystem.categoryId);
  if (!category || category.vehicleId !== vehicleId) notFound();

  const stats = await Promise.all(assemblies.map((assembly) => getAssemblyStats(assembly.id)));

  const canManage = profile.role === "admin" || (profile.role === "leader" && profile.bomCategory === category.name);

  return (
    <div className="flex flex-col gap-4">
      <VehicleBreadcrumb
        items={[
          { label: "Vehicle", href: "/dashboard/vehicle" },
          { label: vehicle.vehicleName, href: `/dashboard/vehicle/${vehicleId}` },
          { label: BOM_CATEGORY_LABELS[category.name], href: `/dashboard/vehicle/${vehicleId}/categories/${category.id}` },
          { label: subsystem.name },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">{subsystem.name}</h2>
        {canManage ? <CreateAssemblyButton subsystemId={subsystemId} /> : null}
      </div>

      {assemblies.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">등록된 Assembly가 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assemblies.map((assembly, index) => (
            <Link key={assembly.id} href={`/dashboard/vehicle/${vehicleId}/assemblies/${assembly.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{assembly.name}</CardTitle>
                  <CardDescription>Rev {assembly.revision}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  부품 {stats[index]?.partCount ?? 0}개 · 진행률 {stats[index]?.progressPercent ?? 0}%
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
