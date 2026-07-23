import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { canDeleteWorkJournal, canEditWorkJournal } from "@/lib/work-journal/permissions";
import { formatWorkDuration } from "@/lib/work-journal/format";
import {
  getWorkJournal,
  listWorkJournalConsumables,
  listWorkJournalFiles,
  listWorkJournalParticipants,
} from "@/services/work-journal-service";
import { CategoryBadge } from "@/components/bom/category-badge";
import { RichTextContent } from "@/components/editor/rich-text-content";
import { Badge } from "@/components/ui/badge";
import { DeleteWorkJournalButton } from "@/components/work-journal/delete-work-journal-button";
import { EditWorkJournalButton } from "@/components/work-journal/edit-work-journal-button";
import { WorkJournalFilesList } from "@/components/work-journal/work-journal-files-list";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const journal = await getWorkJournal(id);
  return { title: `${journal?.title ?? "Work Journal"} | SKID` };
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default async function WorkJournalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireUser();
  const { id } = await params;

  const journal = await getWorkJournal(id);
  if (!journal) notFound();

  const [files, participants, consumables] = await Promise.all([
    listWorkJournalFiles(id),
    listWorkJournalParticipants(id),
    listWorkJournalConsumables(id),
  ]);

  const canEdit = canEditWorkJournal(profile, journal);
  const canDelete = canDeleteWorkJournal(profile, journal);

  return (
    <div className="flex flex-col gap-4">
      <VehicleBreadcrumb items={[{ label: "Work Journal", href: "/dashboard/work-journal" }, { label: journal.title }]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{journal.title}</h2>
          <p className="text-sm text-muted-foreground">
            {journal.authorName ?? "알 수 없음"} · {formatDateTime(journal.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit ? <EditWorkJournalButton journal={journal} participants={participants} consumables={consumables} /> : null}
          {canDelete ? <DeleteWorkJournalButton id={journal.id} title={journal.title} redirectTo="/dashboard/work-journal" /> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <CategoryBadge category={journal.engineeringCategory} />
        <span>{journal.vehicleName}</span>
        {journal.subsystemName ? <span>· {journal.subsystemName}</span> : null}
        {journal.assemblyName ? <span>· {journal.assemblyName}</span> : null}
      </div>

      <div className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">작업 시작</p>
          <p>{formatDateTime(journal.workStart)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">작업 종료</p>
          <p>{formatDateTime(journal.workEnd)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">총 작업 시간</p>
          <p>{formatWorkDuration(journal.totalWorkTime)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">참여자</h3>
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 참여자가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {participants.map((participant) => (
              <Badge key={participant.id} variant="secondary">
                {participant.memberName ?? "알 수 없음"}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <RichTextContent html={journal.content} className="rounded-lg border p-4" />

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">소모품 사용</h3>
        {consumables.length === 0 ? (
          <p className="text-sm text-muted-foreground">사용된 소모품이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {consumables.map((consumable) => (
              <li key={consumable.id} className="flex items-center justify-between rounded-md border px-3 py-1.5">
                <span>
                  {consumable.itemCode} · {consumable.itemName}
                </span>
                <span className="text-muted-foreground">
                  {consumable.quantityUsed}
                  {consumable.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">첨부 파일</h3>
        <WorkJournalFilesList journalId={journal.id} files={files} canManage={canEdit} />
      </div>
    </div>
  );
}
