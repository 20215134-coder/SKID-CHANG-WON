import { cn } from "@/lib/utils";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/general-documents/constants";
import type { DocumentCategory } from "@/types/database.types";

const CATEGORY_CLASSES: Record<DocumentCategory, string> = {
  rules: "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300",
  design_report: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  cost_report: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  ses: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  team_documents: "bg-purple-100 text-purple-700 dark:bg-purple-400/15 dark:text-purple-300",
  other: "bg-muted text-muted-foreground",
};

export function DocumentCategoryBadge({ category }: { category: DocumentCategory }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        CATEGORY_CLASSES[category],
      )}
    >
      {DOCUMENT_CATEGORY_LABELS[category]}
    </span>
  );
}
