import type { UserRole } from "@/types/database.types";

const ROLE_RANK: Record<UserRole, number> = {
  member: 0,
  leader: 1,
  admin: 2,
};

export function hasMinimumRole(role: UserRole, minimum: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "관리자",
  leader: "팀장",
  member: "팀원",
};
