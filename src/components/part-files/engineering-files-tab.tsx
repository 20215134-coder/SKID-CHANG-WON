import { formatFileSize } from "@/lib/part-files/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteFileButton } from "@/components/part-files/delete-file-button";
import { FileDownloadButton } from "@/components/part-files/file-download-button";
import { FileHistoryDialog } from "@/components/part-files/file-history-dialog";
import { FileTypeIcon } from "@/components/part-files/file-type-icon";
import { ReplaceFileButton } from "@/components/part-files/replace-file-button";
import { UploadFilesButton } from "@/components/part-files/upload-files-button";
import type { PartFile } from "@/services/part-file-service";

export function EngineeringFilesTab({
  partId,
  files,
  canManage,
  canDelete,
}: {
  partId: string;
  files: PartFile[];
  canManage: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">{canManage ? <UploadFilesButton partId={partId} /> : null}</div>

      {files.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">첨부된 엔지니어링 파일이 없습니다.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>파일명</TableHead>
              <TableHead>형식</TableHead>
              <TableHead>크기</TableHead>
              <TableHead>버전</TableHead>
              <TableHead>업로드한 사람</TableHead>
              <TableHead>업로드 일시</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="flex max-w-64 items-center gap-1.5 font-medium">
                  <FileTypeIcon fileType={file.fileType} />
                  <span className="truncate">{file.fileName}</span>
                </TableCell>
                <TableCell className="uppercase">{file.fileType}</TableCell>
                <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                <TableCell>v{file.version}</TableCell>
                <TableCell>{file.uploadedByName ?? "-"}</TableCell>
                <TableCell>{new Date(file.uploadedAt).toLocaleDateString("ko-KR")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <FileDownloadButton path={file.storagePath} fileName={file.fileName} />
                    <FileHistoryDialog lineageId={file.lineageId} fileName={file.fileName} />
                    {canManage ? <ReplaceFileButton fileId={file.id} fileName={file.fileName} /> : null}
                    {canDelete ? <DeleteFileButton fileId={file.id} fileName={file.fileName} /> : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
