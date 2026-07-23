import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { canDeleteDesignJournal, canEditDesignJournal } from "@/lib/design-journal/permissions";
import { getDesignJournal, listDesignJournalFiles } from "@/services/design-journal-service";
import { CategoryBadge } from "@/components/bom/category-badge";
import { RichTextContent } from "@/components/editor/rich-text-content";
import { Badge } from "@/components/ui/badge";
import { DeleteDesignJournalButton } from "@/components/design-journal/delete-design-journal-button";
import { DesignJournalFilesList } from "@/components/design-journal/design-journal-files-list";
import { EditDesignJournalButton } from "@/components/design-journal/edit-design-journal-button";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const journal = await getDesignJournal(id);
  return { title: `${journal?.title ?? "Design Journal"} | FSAE ERP` };
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default async function DesignJournalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireUser();
  const { id } = await params;

  const journal = await getDesignJournal(id);
  if (!journal) notFound();

  const files = await listDesignJournalFiles(id);

  const canEdit = canEditDesignJournal(profile, journal);
  const canDelete = canDeleteDesignJournal(profile, journal);

  return (
    <div className="flex flex-col gap-4">
      <VehicleBreadcrumb items={[{ label: "Design Journal", href: "/dashboard/design-journal" }, { label: journal.title }]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{journal.title}</h2>
          <p className="text-sm text-muted-foreground">
            {journal.authorName ?? "알 수 없음"} · {formatDateTime(journal.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit ? <EditDesignJournalButton journal={journal} /> : null}
          {canDelete ? <DeleteDesignJournalButton id={journal.id} title={journal.title} redirectTo="/dashboard/design-journal" /> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <CategoryBadge category={journal.engineeringCategory} />
        <span>{journal.vehicleName}</span>
        {journal.subsystemName ? <span>· {journal.subsystemName}</span> : null}
        {journal.assemblyName ? <span>· {journal.assemblyName}</span> : null}
      </div>

      {journal.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {journal.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      <RichTextContent html={journal.content} className="rounded-lg border p-4" />

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">첨부 파일</h3>
        <DesignJournalFilesList journalId={journal.id} files={files} canManage={canEdit} />
      </div>
    </div>
  );
}
