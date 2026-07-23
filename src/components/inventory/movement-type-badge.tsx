import { cn } from "@/lib/utils";
import { MOVEMENT_TYPE_LABELS } from "@/lib/inventory/constants";
import type { InventoryMovementType } from "@/types/database.types";

const MOVEMENT_CLASSES: Record<InventoryMovementType, string> = {
  in: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  out: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  adjustment: "bg-purple-100 text-purple-700 dark:bg-purple-400/15 dark:text-purple-300",
  transfer: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  work_journal_consumption: "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
};

export function MovementTypeBadge({ movementType }: { movementType: InventoryMovementType }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        MOVEMENT_CLASSES[movementType],
      )}
    >
      {MOVEMENT_TYPE_LABELS[movementType]}
    </span>
  );
}
