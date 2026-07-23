import { redirect } from "next/navigation";

import { hasMinimumRole } from "@/lib/auth/roles";
import { getCurrentProfile } from "@/services/profile-service";
import type { AuthProfile } from "@/types/auth";
import type { UserRole } from "@/types/database.types";

export async function requireUser(): Promise<AuthProfile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.status !== "active") redirect("/account-status");
  return profile;
}

export async function requireRole(minimum: UserRole): Promise<AuthProfile> {
  const profile = await requireUser();
  if (!hasMinimumRole(profile.role, minimum)) redirect("/dashboard");
  return profile;
}
