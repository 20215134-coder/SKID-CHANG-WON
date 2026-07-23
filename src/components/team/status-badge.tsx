import { Badge } from "@/components/ui/badge";
import type { MemberStatus } from "@/types/database.types";

export const STATUS_LABELS: Record<MemberStatus, string> = {
  pending: "승인 대기",
  active: "활성",
  inactive: "비활성",
};

const STATUS_VARIANTS: Record<MemberStatus, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  active: "default",
  inactive: "destructive",
};

export function StatusBadge({ status }: { status: MemberStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
