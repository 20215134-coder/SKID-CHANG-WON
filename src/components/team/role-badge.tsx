import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { UserRole } from "@/types/database.types";

const ROLE_VARIANTS: Record<UserRole, "default" | "secondary" | "outline"> = {
  admin: "default",
  leader: "secondary",
  member: "outline",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge variant={ROLE_VARIANTS[role]}>{ROLE_LABELS[role]}</Badge>;
}
