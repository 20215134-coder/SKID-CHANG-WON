import { formatFileSize } from "@/lib/part-files/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteAssemblyFileButton } from "@/components/assembly-files/delete-assembly-file-button";
import { UploadAssemblyFilesButton } from "@/components/assembly-files/upload-assembly-files-button";
import { FileDownloadButton } from "@/components/part-files/file-download-button";
import { FileTypeIcon } from "@/components/part-files/file-type-icon";
import type { AssemblyFile } from "@/services/assembly-file-service";

export function AssemblyFilesSection({
  assemblyId,
  files,
  canManage,
}: {
  assemblyId: string;
  files: AssemblyFile[];
  canManage: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">첨부 파일</h3>
        {canManage ? <UploadAssemblyFilesButton assemblyId={assemblyId} /> : null}
      </div>

      {files.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">첨부된 파일이 없습니다.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>파일명</TableHead>
              <TableHead>형식</TableHead>
              <TableHead>크기</TableHead>
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
                <TableCell>{file.uploadedByName ?? "-"}</TableCell>
                <TableCell>{new Date(file.uploadedAt).toLocaleDateString("ko-KR")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <FileDownloadButton path={file.storagePath} fileName={file.fileName} />
                    {canManage ? <DeleteAssemblyFileButton fileId={file.id} fileName={file.fileName} /> : null}
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
