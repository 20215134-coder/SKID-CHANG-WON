import { getGeneralDocumentDownloadUrl } from "@/features/general-documents/actions";
import { DownloadFileButton } from "@/components/files/download-file-button";

export function DocumentDownloadButton({ path, fileName }: { path: string; fileName: string }) {
  return <DownloadFileButton path={path} fileName={fileName} getUrl={getGeneralDocumentDownloadUrl} />;
}
