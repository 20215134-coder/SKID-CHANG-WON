import Link from "next/link";
import { Paperclip } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataEntry } from "@/services/data-entry-service";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function DataEntryCard({ entry }: { entry: DataEntry }) {
  return (
    <Link href={`/dashboard/data/${entry.id}`}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base">{entry.title}</CardTitle>
            <Badge variant="secondary">{entry.category}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            {entry.createdByName ?? "알 수 없음"} · {formatDate(entry.createdAt)}
          </p>
          {entry.description ? <p className="line-clamp-2">{entry.description}</p> : null}
          <div className="flex items-center gap-3 text-xs">
            {entry.relatedVehicleName ? <span>{entry.relatedVehicleName}</span> : null}
            {entry.fileCount > 0 ? (
              <span className="flex items-center gap-1">
                <Paperclip className="size-3" />
                {entry.fileCount}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
