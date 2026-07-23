"use client";

import { useTransition } from "react";
import { Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteWorkJournalFile, getWorkJournalFileDownloadUrl } from "@/features/work-journal/actions";
import { Button } from "@/components/ui/button";
import { DownloadFileButton } from "@/components/files/download-file-button";
import type { WorkJournalFile } from "@/services/work-journal-service";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function WorkJournalFilesList({ journalId, files, canManage }: { journalId: string; files: WorkJournalFile[]; canManage: boolean }) {
  const [pending, startTransition] = useTransition();

  function handleDelete(fileId: string) {
    startTransition(async () => {
      const result = await deleteWorkJournalFile(fileId, journalId);
      if (result.error) toast.error(result.error);
      else toast.success("파일을 삭제했습니다.");
    });
  }

  if (files.length === 0) {
    return <p className="text-sm text-muted-foreground">첨부된 파일이 없습니다.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {files.map((file) => (
        <li key={file.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{file.fileName}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <DownloadFileButton path={file.storagePath} fileName={file.fileName} getUrl={getWorkJournalFileDownloadUrl} />
            {canManage ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(file.id)}
                disabled={pending}
                aria-label="파일 삭제"
              >
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
