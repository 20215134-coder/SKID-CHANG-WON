import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { AuthProfile } from "@/types/auth";

// 대시보드 레이아웃과 각 페이지가 모두 requireUser()를 독립적으로 호출하는데, cache()로 감싸지 않으면
// 페이지 이동 한 번마다 Supabase Auth/프로필 조회가 여러 번 중복 실행되어 왕복 지연이 그만큼 쌓인다.
// React의 요청 단위 메모이제이션으로 같은 렌더 패스 안에서는 실제 조회를 한 번만 수행하게 한다.
export const getCurrentProfile = cache(async (): Promise<AuthProfile | null> => {
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
});

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
