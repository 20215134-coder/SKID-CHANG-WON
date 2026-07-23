import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/require-user";
import { listVehicles } from "@/services/vehicle-service";
import { CreateVehicleButton } from "@/components/vehicle/create-vehicle-button";
import { VehicleStatusBadge } from "@/components/vehicle/vehicle-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Vehicle | SKID",
};

export default async function VehicleListPage() {
  const profile = await requireUser();
  const vehicles = await listVehicles();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Vehicle</h2>
          <p className="text-sm text-muted-foreground">시즌별 차량과 엔지니어링 구조를 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/dashboard/vehicle/fasteners" />} nativeButton={false}>
            체결류 관리
          </Button>
          {profile.role === "admin" ? <CreateVehicleButton /> : null}
        </div>
      </div>

      {vehicles.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">등록된 차량이 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Link key={vehicle.id} href={`/dashboard/vehicle/${vehicle.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    {vehicle.vehicleName}
                    <VehicleStatusBadge status={vehicle.status} />
                  </CardTitle>
                  <CardDescription>{vehicle.competitionYear} 시즌</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
