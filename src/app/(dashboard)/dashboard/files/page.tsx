import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/require-user";
import { listVehicles } from "@/services/vehicle-service";
import { listGeneralDocuments } from "@/services/general-document-service";
import { DOCUMENT_CATEGORIES } from "@/lib/general-documents/constants";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentFilters } from "@/components/general-documents/document-filters";
import { DocumentTable } from "@/components/general-documents/document-table";
import { UploadDocumentButton } from "@/components/general-documents/upload-document-button";
import { VehicleStatusBadge } from "@/components/vehicle/vehicle-status-badge";
import type { DocumentCategory } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Files | SKID",
};

export default async function FilesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const profile = await requireUser();
  const { category } = await searchParams;

  const selectedCategory = category && DOCUMENT_CATEGORIES.includes(category as DocumentCategory) ? (category as DocumentCategory) : undefined;

  const [documents, vehicles] = await Promise.all([listGeneralDocuments(selectedCategory), listVehicles()]);

  const canManage = profile.role === "admin" || profile.role === "leader";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Files</h2>
        <p className="text-sm text-muted-foreground">팀 공용 문서와 차량 엔지니어링 파일을 관리합니다.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight">General Documents</h3>
          {canManage ? <UploadDocumentButton /> : null}
        </div>

        <DocumentFilters currentCategory={selectedCategory ?? "all"} />

        <DocumentTable documents={documents} canManage={canManage} canDelete={profile.role === "admin"} />
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold tracking-tight">Vehicle Files</h3>
        <p className="text-sm text-muted-foreground">
          Vehicle 모듈과 동일한 엔지니어링 구조(Chassis/Powertrain/Electrical/Aero → Subsystem → Assembly → Part)를 따라 파일을 찾을 수 있습니다.
        </p>

        {vehicles.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">등록된 차량이 없습니다.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <Link key={vehicle.id} href={`/dashboard/files/vehicle/${vehicle.id}`}>
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
    </div>
  );
}
