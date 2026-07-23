import { cn } from "@/lib/utils";
import { INVENTORY_ITEM_STATUS_LABELS } from "@/lib/inventory/constants";
import type { InventoryItemStatus } from "@/types/database.types";

const STATUS_CLASSES: Record<InventoryItemStatus, string> = {
  in_stock: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  low_stock: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  out_of_stock: "bg-destructive/10 text-destructive dark:bg-destructive/20",
  discontinued: "bg-muted text-muted-foreground",
};

export function InventoryStatusBadge({ status }: { status: InventoryItemStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_CLASSES[status],
      )}
    >
      {INVENTORY_ITEM_STATUS_LABELS[status]}
    </span>
  );
}
