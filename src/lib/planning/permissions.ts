import type { AuthProfile } from "@/types/auth";

// Annual Plan / Milestone CRUD 권한 (Admin 또는 Team Leader).
export function canManagePlans(profile: Pick<AuthProfile, "role" | "isTeamLeader">): boolean {
  return profile.role === "admin" || profile.isTeamLeader;
}
