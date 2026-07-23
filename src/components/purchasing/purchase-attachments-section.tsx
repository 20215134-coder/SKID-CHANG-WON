import { getPurchaseFileDownloadUrl } from "@/features/purchasing/actions";
import { formatFileSize } from "@/lib/part-files/format";
import { DownloadFileButton } from "@/components/files/download-file-button";
import { DeleteAttachmentButton } from "@/components/purchasing/delete-attachment-button";
import { UploadAttachmentsButton } from "@/components/purchasing/upload-attachments-button";
import { FileTypeIcon } from "@/components/part-files/file-type-icon";
import type { PurchaseRequestFile } from "@/services/purchase-service";

export function PurchaseAttachmentsSection({
  purchaseRequestId,
  files,
  canManage,
}: {
  purchaseRequestId: string;
  files: PurchaseRequestFile[];
  canManage: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">첨부 파일</h3>
        {canManage ? <UploadAttachmentsButton purchaseRequestId={purchaseRequestId} /> : null}
      </div>

      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">첨부된 파일이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {files.map((file) => (
            <li key={file.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <FileTypeIcon fileType={file.fileType} />
                <div className="min-w-0">
                  <p className="truncate text-sm">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)}
                    {file.uploadedByName ? ` · ${file.uploadedByName}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <DownloadFileButton path={file.storagePath} fileName={file.fileName} getUrl={getPurchaseFileDownloadUrl} />
                {canManage ? <DeleteAttachmentButton fileId={file.id} fileName={file.fileName} /> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
