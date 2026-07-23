import type { AuthProfile } from "@/types/auth";

export function canManagePurchasing(profile: Pick<AuthProfile, "role" | "isTreasurer">): boolean {
  return profile.role === "admin" || profile.isTreasurer;
}
