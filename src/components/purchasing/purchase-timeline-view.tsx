import type { PurchaseTimelineEntry } from "@/services/purchase-service";
import type { PurchaseTimelineEvent } from "@/types/database.types";

const EVENT_LABELS: Record<PurchaseTimelineEvent, string> = {
  created: "요청 생성",
  submitted: "제출됨",
  approved: "승인됨",
  rejected: "반려됨",
  purchased: "구매 완료",
  cancelled: "취소됨",
  receipt_updated: "영수증 교체",
};

export function PurchaseTimelineView({ entries }: { entries: PurchaseTimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">이력이 없습니다.</p>;
  }

  return (
    <ol className="flex flex-col gap-3 border-l pl-4">
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span className="absolute top-1.5 -left-[1.1rem] size-2 rounded-full bg-border" />
          <div className="text-sm font-medium">{EVENT_LABELS[entry.eventType]}</div>
          <p className="text-xs text-muted-foreground">
            {new Date(entry.createdAt).toLocaleString("ko-KR")}
            {entry.actorName ? ` · ${entry.actorName}` : ""}
          </p>
          {entry.note ? <p className="mt-1 text-sm whitespace-pre-wrap">{entry.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}
