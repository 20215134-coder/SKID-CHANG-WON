import type { AuthProfile } from "@/types/auth";
import type { BomCategory } from "@/types/database.types";

export function canManageInventoryItem(
  profile: Pick<AuthProfile, "role" | "bomCategory" | "department">,
  item: { relatedPartCategory: BomCategory | null; owningDepartment: string | null },
): boolean {
  if (profile.role === "admin") return true;
  if (profile.role !== "leader") return false;

  if (item.relatedPartCategory && item.relatedPartCategory === profile.bomCategory) return true;
  if (item.owningDepartment && profile.department && item.owningDepartment === profile.department) return true;

  return false;
}
