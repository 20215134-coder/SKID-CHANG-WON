import { cn } from "@/lib/utils";
import { MANUFACTURING_STATUS_LABELS } from "@/lib/bom/constants";
import type { ManufacturingStatus } from "@/types/database.types";

const STATUS_CLASSES: Record<ManufacturingStatus, string> = {
  designing: "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300",
  ready_for_manufacturing: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  manufacturing: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  inspection: "bg-purple-100 text-purple-700 dark:bg-purple-400/15 dark:text-purple-300",
  assembly: "bg-cyan-100 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
};

export function ManufacturingStatusBadge({ status }: { status: ManufacturingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_CLASSES[status],
      )}
    >
      {MANUFACTURING_STATUS_LABELS[status]}
    </span>
  );
}
