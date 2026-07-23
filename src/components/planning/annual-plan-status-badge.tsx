import { cn } from "@/lib/utils";
import { ANNUAL_PLAN_STATUS_LABELS } from "@/lib/planning/constants";
import type { AnnualPlanStatus } from "@/types/database.types";

const STATUS_CLASSES: Record<AnnualPlanStatus, string> = {
  planning: "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300",
  active: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  archived: "bg-muted text-muted-foreground",
};

export function AnnualPlanStatusBadge({ status }: { status: AnnualPlanStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_CLASSES[status],
      )}
    >
      {ANNUAL_PLAN_STATUS_LABELS[status]}
    </span>
  );
}
