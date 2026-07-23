import { cn } from "@/lib/utils";
import { MILESTONE_STATUS_LABELS } from "@/lib/planning/constants";
import type { MilestoneStatus } from "@/types/database.types";

const STATUS_CLASSES: Record<MilestoneStatus, string> = {
  planned: "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
};

export function MilestoneStatusBadge({ status }: { status: MilestoneStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_CLASSES[status],
      )}
    >
      {MILESTONE_STATUS_LABELS[status]}
    </span>
  );
}
