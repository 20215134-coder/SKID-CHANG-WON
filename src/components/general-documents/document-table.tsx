import { formatFileSize } from "@/lib/part-files/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteDocumentButton } from "@/components/general-documents/delete-document-button";
import { DocumentCategoryBadge } from "@/components/general-documents/document-category-badge";
import { DocumentDownloadButton } from "@/components/general-documents/document-download-button";
import { EditDocumentButton } from "@/components/general-documents/edit-document-button";
import type { GeneralDocument } from "@/services/general-document-service";

export function DocumentTable({
  documents,
  canManage,
  canDelete,
}: {
  documents: GeneralDocument[];
  canManage: boolean;
  canDelete: boolean;
}) {
  if (documents.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">등록된 문서가 없습니다.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>제목</TableHead>
          <TableHead>분류</TableHead>
          <TableHead>형식</TableHead>
          <TableHead>크기</TableHead>
          <TableHead>업로드한 사람</TableHead>
          <TableHead>업로드 일시</TableHead>
          <TableHead className="text-right">작업</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((document) => (
          <TableRow key={document.id}>
            <TableCell className="max-w-64 truncate font-medium">{document.title}</TableCell>
            <TableCell>
              <DocumentCategoryBadge category={document.category} />
            </TableCell>
            <TableCell className="uppercase">{document.fileType}</TableCell>
            <TableCell>{formatFileSize(document.fileSize)}</TableCell>
            <TableCell>{document.uploadedByName ?? "-"}</TableCell>
            <TableCell>{new Date(document.uploadedAt).toLocaleDateString("ko-KR")}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end">
                <DocumentDownloadButton path={document.storagePath} fileName={document.fileName} />
                {canManage ? <EditDocumentButton document={document} /> : null}
                {canDelete ? <DeleteDocumentButton id={document.id} title={document.title} /> : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
