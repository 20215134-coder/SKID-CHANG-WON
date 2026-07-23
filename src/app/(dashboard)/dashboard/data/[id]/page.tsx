import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { getDataEntry, listDataCategories, listDataEntryFiles } from "@/services/data-entry-service";
import { listVehicles } from "@/services/vehicle-service";
import { DataEntryFilesList } from "@/components/data-entries/data-entry-files-list";
import { DeleteDataEntryButton } from "@/components/data-entries/delete-data-entry-button";
import { EditDataEntryButton } from "@/components/data-entries/edit-data-entry-button";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const entry = await getDataEntry(id);
  return { title: `${entry?.title ?? "Data"} | FSAE ERP` };
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default async function DataEntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireUser();
  const { id } = await params;

  const entry = await getDataEntry(id);
  if (!entry) notFound();

  const [files, categories, vehicles] = await Promise.all([listDataEntryFiles(id), listDataCategories(), listVehicles()]);

  const canManage = profile.role !== "member";
  const canDelete = profile.role === "admin";

  return (
    <div className="flex flex-col gap-4">
      <VehicleBreadcrumb items={[{ label: "Data", href: "/dashboard/data" }, { label: entry.title }]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{entry.title}</h2>
          <p className="text-sm text-muted-foreground">
            {entry.createdByName ?? "알 수 없음"} · {formatDateTime(entry.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {canManage ? <EditDataEntryButton entry={entry} categories={categories} vehicles={vehicles} /> : null}
          {canDelete ? <DeleteDataEntryButton id={entry.id} title={entry.title} /> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">{entry.category}</span>
        {entry.relatedVehicleName ? <span>{entry.relatedVehicleName}</span> : null}
      </div>

      {entry.description ? <p className="rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap">{entry.description}</p> : null}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">첨부 파일</h3>
        <DataEntryFilesList dataEntryId={id} files={files} canManage={canManage} />
      </div>
    </div>
  );
}
