import { Box, FileImage, FileText, Paperclip } from "lucide-react";

import { getPartFileCategory } from "@/lib/part-files/constants";
import { cn } from "@/lib/utils";

export function FileTypeIcon({ fileType, className }: { fileType: string; className?: string }) {
  const category = getPartFileCategory(fileType);

  if (category === "cad") return <Box className={cn("size-4 text-blue-500", className)} />;
  if (category === "drawing") return <FileText className={cn("size-4 text-orange-500", className)} />;
  if (category === "image") return <FileImage className={cn("size-4 text-emerald-500", className)} />;
  return <Paperclip className={cn("size-4 text-muted-foreground", className)} />;
}
