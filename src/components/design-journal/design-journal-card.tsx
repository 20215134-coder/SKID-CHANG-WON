import Link from "next/link";

import { CategoryBadge } from "@/components/bom/category-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DesignJournal } from "@/services/design-journal-service";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function DesignJournalCard({ journal }: { journal: DesignJournal }) {
  return (
    <Link href={`/dashboard/design-journal/${journal.id}`}>
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
          {journal.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {journal.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
