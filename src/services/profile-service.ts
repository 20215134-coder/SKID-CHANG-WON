import { createClient } from "@/lib/supabase/server";
import type { AuthProfile } from "@/types/auth";

export async function getCurrentProfile(): Promise<AuthProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status, bom_category, is_treasurer, is_team_leader, department")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    status: profile.status,
    bomCategory: profile.bom_category,
    isTreasurer: profile.is_treasurer,
    isTeamLeader: profile.is_team_leader,
    department: profile.department,
  };
}

export interface TeamStats {
  total: number;
  admin: number;
  leader: number;
  member: number;
}

export async function getTeamStats(): Promise<TeamStats> {
  const supabase = await createClient();

  const { data } = await supabase.from("profiles").select("role").eq("status", "active");
  const rows = data ?? [];

  return {
    total: rows.length,
    admin: rows.filter((row) => row.role === "admin").length,
    leader: rows.filter((row) => row.role === "leader").length,
    member: rows.filter((row) => row.role === "member").length,
  };
}
