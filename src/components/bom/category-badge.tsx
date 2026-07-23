import { Badge } from "@/components/ui/badge";
import { BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import type { BomCategory } from "@/types/database.types";

const CATEGORY_VARIANTS: Record<BomCategory, "default" | "secondary" | "outline"> = {
  chassis: "default",
  powertrain: "secondary",
  aero: "outline",
  electrical: "outline",
  common: "outline",
};

export function CategoryBadge({ category }: { category: BomCategory }) {
  return <Badge variant={CATEGORY_VARIANTS[category]}>{BOM_CATEGORY_LABELS[category]}</Badge>;
}
