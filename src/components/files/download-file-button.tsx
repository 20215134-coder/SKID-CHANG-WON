"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function DownloadFileButton({
  path,
  fileName,
  getUrl,
}: {
  path: string;
  fileName: string;
  getUrl: (path: string) => Promise<string | null>;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const url = await getUrl(path);
      if (!url) {
        toast.error("파일을 불러올 수 없습니다.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={pending}
      title={`${fileName} 다운로드`}
      aria-label={`${fileName} 다운로드`}
      className="size-8"
    >
      <Download className="size-3.5" />
    </Button>
  );
}
