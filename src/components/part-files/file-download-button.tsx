import { getDownloadUrl } from "@/features/bom/actions";
import { DownloadFileButton } from "@/components/files/download-file-button";

export function FileDownloadButton({ path, fileName }: { path: string; fileName: string }) {
  return <DownloadFileButton path={path} fileName={fileName} getUrl={getDownloadUrl} />;
}
