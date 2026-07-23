import { cn } from "@/lib/utils";
import { PURCHASE_STATUS_LABELS } from "@/lib/purchasing/constants";
import type { PurchaseStatus } from "@/types/database.types";

const STATUS_CLASSES: Record<PurchaseStatus, string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300",
  pending_approval: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  rejected: "bg-destructive/10 text-destructive dark:bg-destructive/20",
  purchased: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  cancelled: "bg-muted text-muted-foreground",
};

export function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_CLASSES[status],
      )}
    >
      {PURCHASE_STATUS_LABELS[status]}
    </span>
  );
}
