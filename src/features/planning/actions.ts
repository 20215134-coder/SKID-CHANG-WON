"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { canManagePlans } from "@/lib/planning/permissions";
import { createClient } from "@/lib/supabase/server";

import { annualPlanFormSchema, milestoneFormSchema } from "./schemas";

export interface PlanningActionState {
  error?: string;
  success?: boolean;
  id?: string;
}

function revalidatePlanningPaths() {
  revalidatePath("/dashboard/planning", "layout");
  revalidatePath("/dashboard");
}

export async function createAnnualPlan(
  _prevState: PlanningActionState,
  formData: FormData,
): Promise<PlanningActionState> {
  const profile = await requireUser();

  if (!canManagePlans(profile)) {
    return { error: "연간 계획을 생성할 권한이 없습니다." };
  }

  const parsed = annualPlanFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    season: formData.get("season"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("annual_plans")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      season: parsed.data.season,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      status: parsed.data.status,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !created) {
    return {
      error: error?.code === "23505" ? "이미 해당 시즌의 연간 계획이 있습니다." : "연간 계획 생성 중 오류가 발생했습니다.",
    };
  }

  revalidatePlanningPaths();
  return { success: true, id: created.id };
}

export async function updateAnnualPlan(
  _prevState: PlanningActionState,
  formData: FormData,
): Promise<PlanningActionState> {
  const profile = await requireUser();

  if (!canManagePlans(profile)) {
    return { error: "연간 계획을 수정할 권한이 없습니다." };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "잘못된 요청입니다." };
  }

  const parsed = annualPlanFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    season: formData.get("season"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("annual_plans")
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      season: parsed.data.season,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      status: parsed.data.status,
    })
    .eq("id", id);

  if (error) {
    return {
      error: error.code === "23505" ? "이미 해당 시즌의 연간 계획이 있습니다." : "연간 계획 수정 중 오류가 발생했습니다.",
    };
  }

  revalidatePlanningPaths();
  return { success: true, id };
}

export async function deleteAnnualPlan(id: string): Promise<{ error?: string }> {
  const profile = await requireUser();
  if (profile.role !== "admin") {
    return { error: "삭제 권한이 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("annual_plans").delete().eq("id", id);

  if (error) {
    return { error: "삭제 중 오류가 발생했습니다." };
  }

  revalidatePlanningPaths();
  return {};
}

export async function createMilestone(
  _prevState: PlanningActionState,
  formData: FormData,
): Promise<PlanningActionState> {
  const profile = await requireUser();

  if (!canManagePlans(profile)) {
    return { error: "마일스톤을 생성할 권한이 없습니다." };
  }

  const parsed = milestoneFormSchema.safeParse({
    annualPlanId: formData.get("annualPlanId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("milestones")
    .insert({
      annual_plan_id: parsed.data.annualPlanId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      due_date: parsed.data.dueDate,
      status: parsed.data.status,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: "마일스톤 생성 중 오류가 발생했습니다." };
  }

  revalidatePlanningPaths();
  return { success: true, id: created.id };
}

export async function updateMilestone(
  _prevState: PlanningActionState,
  formData: FormData,
): Promise<PlanningActionState> {
  const profile = await requireUser();

  if (!canManagePlans(profile)) {
    return { error: "마일스톤을 수정할 권한이 없습니다." };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "잘못된 요청입니다." };
  }

  const parsed = milestoneFormSchema.safeParse({
    annualPlanId: formData.get("annualPlanId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("milestones")
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      due_date: parsed.data.dueDate,
      status: parsed.data.status,
    })
    .eq("id", id);

  if (error) {
    return { error: "마일스톤 수정 중 오류가 발생했습니다." };
  }

  revalidatePlanningPaths();
  return { success: true, id };
}

export async function deleteMilestone(id: string): Promise<{ error?: string }> {
  const profile = await requireUser();
  if (!canManagePlans(profile)) {
    return { error: "삭제 권한이 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("milestones").delete().eq("id", id);

  if (error) {
    return { error: "삭제 중 오류가 발생했습니다." };
  }

  revalidatePlanningPaths();
  return {};
}
