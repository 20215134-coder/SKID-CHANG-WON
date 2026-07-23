import { cn } from "@/lib/utils";
import { ASSET_CONDITION_LABELS } from "@/lib/assets/constants";
import type { AssetCondition } from "@/types/database.types";

const CONDITION_CLASSES: Record<AssetCondition, string> = {
  excellent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  good: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  fair: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  poor: "bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300",
  out_of_service: "bg-destructive/10 text-destructive dark:bg-destructive/20",
};

export function AssetConditionBadge({ condition }: { condition: AssetCondition }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        CONDITION_CLASSES[condition],
      )}
    >
      {ASSET_CONDITION_LABELS[condition]}
    </span>
  );
}
