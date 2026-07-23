"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";

import { fetchPartFileHistory } from "@/features/part-files/actions";
import { formatFileSize } from "@/lib/part-files/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileDownloadButton } from "@/components/part-files/file-download-button";
import { FileTypeIcon } from "@/components/part-files/file-type-icon";
import type { PartFile } from "@/services/part-file-service";

export function FileHistoryDialog({ lineageId, fileName }: { lineageId: string; fileName: string }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<PartFile[] | null>(null);

  useEffect(() => {
    if (!open) return;
    fetchPartFileHistory(lineageId).then(setHistory);
  }, [open, lineageId]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => setOpen(true)}
        title={`${fileName} 버전 이력`}
        aria-label={`${fileName} 버전 이력`}
      >
        <History className="size-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>버전 이력</DialogTitle>
            <DialogDescription>{fileName}</DialogDescription>
          </DialogHeader>
          {history === null ? (
            <p className="py-6 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">이력이 없습니다.</p>
          ) : (
            <ol className="flex flex-col gap-3 border-l pl-4">
              {history.map((file) => (
                <li key={file.id} className="relative">
                  <span className="absolute top-1.5 -left-[1.1rem] size-2 rounded-full bg-border" />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
                      <FileTypeIcon fileType={file.fileType} />
                      <span className="truncate">v{file.version}</span>
                      {file.isCurrent ? (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                          현재
                        </span>
                      ) : null}
                    </div>
                    <FileDownloadButton path={file.storagePath} fileName={file.fileName} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)} · {new Date(file.uploadedAt).toLocaleString("ko-KR")}
                    {file.uploadedByName ? ` · ${file.uploadedByName}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
