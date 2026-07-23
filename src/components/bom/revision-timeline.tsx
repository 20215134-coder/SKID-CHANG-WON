import { ManufacturingStatusBadge } from "@/components/bom/manufacturing-status-badge";
import type { BomPartRevision } from "@/services/bom-service";

export function RevisionTimeline({ revisions }: { revisions: BomPartRevision[] }) {
  if (revisions.length === 0) {
    return <p className="text-sm text-muted-foreground">이전 리비전이 없습니다.</p>;
  }

  return (
    <ol className="flex flex-col gap-3 border-l pl-4">
      {revisions.map((revision) => (
        <li key={revision.id} className="relative">
          <span className="absolute top-1.5 -left-[1.1rem] size-2 rounded-full bg-border" />
          <div className="flex items-center gap-2 text-sm font-medium">
            Rev {revision.revision}
            <ManufacturingStatusBadge status={revision.manufacturingStatus} />
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(revision.recordedAt).toLocaleString("ko-KR")}
            {revision.recordedByName ? ` · ${revision.recordedByName}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
