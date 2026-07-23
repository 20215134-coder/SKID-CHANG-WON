import type { AuthProfile } from "@/types/auth";
import type { BomCategory } from "@/types/database.types";

export function canManageBomCategory(profile: Pick<AuthProfile, "role" | "bomCategory">, category: BomCategory): boolean {
  if (profile.role === "admin") return true;
  if (profile.role === "leader") return profile.bomCategory === category;
  return false;
}
