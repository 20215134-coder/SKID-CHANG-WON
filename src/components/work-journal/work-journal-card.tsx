import Link from "next/link";
import { Clock } from "lucide-react";

import { CategoryBadge } from "@/components/bom/category-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatWorkDuration } from "@/lib/work-journal/format";
import type { WorkJournal } from "@/services/work-journal-service";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function WorkJournalCard({ journal }: { journal: WorkJournal }) {
  return (
    <Link href={`/dashboard/work-journal/${journal.id}`}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base">{journal.title}</CardTitle>
            <CategoryBadge category={journal.engineeringCategory} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            {journal.authorName ?? "알 수 없음"} · {formatDate(journal.createdAt)}
          </p>
          <p className="truncate">
            {journal.vehicleName}
            {journal.subsystemName ? ` · ${journal.subsystemName}` : ""}
            {journal.assemblyName ? ` · ${journal.assemblyName}` : ""}
          </p>
          <p className="flex items-center gap-1 text-xs">
            <Clock className="size-3.5" />총 작업 시간 {formatWorkDuration(journal.totalWorkTime)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
