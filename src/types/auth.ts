import type { BomCategory, MemberStatus, UserRole } from "@/types/database.types";

export interface AuthProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  status: MemberStatus;
  bomCategory: BomCategory | null;
  isTreasurer: boolean;
  isTeamLeader: boolean;
  department: string | null;
}
