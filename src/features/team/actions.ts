"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

import { updateMemberSchema } from "./schemas";

export interface TeamActionState {
  error?: string;
  success?: boolean;
}

export async function updateMember(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const actingProfile = await requireRole("leader");

  const parsed = updateMemberSchema.safeParse({
    id: formData.get("id"),
    fullName: formData.get("fullName"),
    studentId: formData.get("studentId"),
    phone: formData.get("phone") || undefined,
    joinedAt: formData.get("joinedAt"),
    department: formData.get("department") || undefined,
    role: formData.get("role") || undefined,
    bomCategory: formData.get("bomCategory") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const updatePayload: {
    full_name: string;
    student_id: string;
    phone: string | null;
    joined_at: string;
    department?: string;
    role?: "admin" | "leader" | "member";
    bom_category?: "chassis" | "powertrain" | "aero" | "electrical" | null;
  } = {
    full_name: parsed.data.fullName,
    student_id: parsed.data.studentId,
    phone: parsed.data.phone ?? null,
    joined_at: parsed.data.joinedAt,
  };

  if (actingProfile.role === "admin") {
    if (parsed.data.department !== undefined) updatePayload.department = parsed.data.department;
    if (parsed.data.role !== undefined) updatePayload.role = parsed.data.role;
    if (parsed.data.bomCategory !== undefined) {
      updatePayload.bom_category = parsed.data.bomCategory === "none" ? null : parsed.data.bomCategory;
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(updatePayload).eq("id", parsed.data.id);

  if (error) {
    return { error: "수정 중 오류가 발생했습니다. 권한 및 입력값을 확인해주세요." };
  }

  revalidatePath("/dashboard/team");
  return { success: true };
}

export async function approveMember(memberId: string): Promise<{ error?: string }> {
  await requireRole("admin");

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ status: "active" }).eq("id", memberId);

  if (error) {
    return { error: "승인 중 오류가 발생했습니다." };
  }

  revalidatePath("/dashboard/team");
  return {};
}

export async function deactivateMember(memberId: string): Promise<{ error?: string }> {
  await requireRole("admin");

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ status: "inactive" }).eq("id", memberId);

  if (error) {
    return { error: "비활성화 중 오류가 발생했습니다." };
  }

  revalidatePath("/dashboard/team");
  return {};
}

export async function reactivateMember(memberId: string): Promise<{ error?: string }> {
  await requireRole("admin");

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ status: "active" }).eq("id", memberId);

  if (error) {
    return { error: "재활성화 중 오류가 발생했습니다." };
  }

  revalidatePath("/dashboard/team");
  return {};
}

// 활성 Treasurer는 항상 최대 1명이어야 하므로, 기존 Treasurer를 먼저 해제한 뒤 새 Treasurer를 지정한다.
export async function assignTreasurer(memberId: string): Promise<{ error?: string }> {
  await requireRole("admin");

  const supabase = await createClient();

  const { error: clearError } = await supabase.from("profiles").update({ is_treasurer: false }).eq("is_treasurer", true);
  if (clearError) {
    return { error: "재무 담당자 지정 중 오류가 발생했습니다." };
  }

  const { error } = await supabase.from("profiles").update({ is_treasurer: true }).eq("id", memberId);
  if (error) {
    return { error: "재무 담당자 지정 중 오류가 발생했습니다." };
  }

  revalidatePath("/dashboard/team");
  return {};
}

export async function removeTreasurer(memberId: string): Promise<{ error?: string }> {
  await requireRole("admin");

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_treasurer: false }).eq("id", memberId);

  if (error) {
    return { error: "재무 담당자 해제 중 오류가 발생했습니다." };
  }

  revalidatePath("/dashboard/team");
  return {};
}

// Team Leader는 Treasurer와 달리 동시에 여러 명일 수 있다.
export async function assignTeamLeader(memberId: string): Promise<{ error?: string }> {
  await requireRole("admin");

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_team_leader: true }).eq("id", memberId);

  if (error) {
    return { error: "Team Leader 지정 중 오류가 발생했습니다." };
  }

  revalidatePath("/dashboard/team");
  return {};
}

export async function removeTeamLeader(memberId: string): Promise<{ error?: string }> {
  await requireRole("admin");

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_team_leader: false }).eq("id", memberId);

  if (error) {
    return { error: "Team Leader 해제 중 오류가 발생했습니다." };
  }

  revalidatePath("/dashboard/team");
  return {};
}
