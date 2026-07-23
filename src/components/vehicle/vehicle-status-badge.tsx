import { Badge } from "@/components/ui/badge";
import type { VehicleStatus } from "@/types/database.types";

const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  planning: "설계 중",
  active: "운영 중",
  archived: "보관됨",
};

const VEHICLE_STATUS_VARIANTS: Record<VehicleStatus, "default" | "secondary" | "outline"> = {
  planning: "secondary",
  active: "default",
  archived: "outline",
};

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  return <Badge variant={VEHICLE_STATUS_VARIANTS[status]}>{VEHICLE_STATUS_LABELS[status]}</Badge>;
}
