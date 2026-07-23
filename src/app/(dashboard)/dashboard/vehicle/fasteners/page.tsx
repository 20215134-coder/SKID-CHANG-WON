import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/require-user";
import { listFasteners } from "@/services/fastener-service";
import { CreateFastenerButton } from "@/components/fasteners/create-fastener-button";
import { FastenerCatalogTable } from "@/components/fasteners/fastener-catalog-table";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";

export const metadata: Metadata = {
  title: "체결류 관리 | SKID",
};

export default async function FastenersPage() {
  const profile = await requireUser();
  const fasteners = await listFasteners();

  const canManage = profile.role === "admin" || profile.role === "leader";
  const canDelete = profile.role === "admin";

  return (
    <div className="flex flex-col gap-6">
      <VehicleBreadcrumb items={[{ label: "Vehicle", href: "/dashboard/vehicle" }, { label: "체결류 관리" }]} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">체결류 관리</h2>
          <p className="text-sm text-muted-foreground">볼트/너트/와셔 등 체결류 공용 카탈로그입니다.</p>
        </div>
        {canManage ? <CreateFastenerButton /> : null}
      </div>

      <FastenerCatalogTable fasteners={fasteners} canManage={canManage} canDelete={canDelete} />
    </div>
  );
}
