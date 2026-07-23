import { cn } from "@/lib/utils";
import { PURCHASE_PRIORITY_LABELS } from "@/lib/purchasing/constants";
import type { PurchasePriority } from "@/types/database.types";

const PRIORITY_CLASSES: Record<PurchasePriority, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  urgent: "bg-destructive/10 text-destructive dark:bg-destructive/20",
};

export function PurchasePriorityBadge({ priority }: { priority: PurchasePriority }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        PRIORITY_CLASSES[priority],
      )}
    >
      {PURCHASE_PRIORITY_LABELS[priority]}
    </span>
  );
}
