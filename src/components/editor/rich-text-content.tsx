import { cn } from "@/lib/utils";

export function RichTextContent({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn("prose prose-sm dark:prose-invert max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
