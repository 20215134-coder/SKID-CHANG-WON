"use server";

import { revalidatePath } from "next/cache";

import { requireRole, requireUser } from "@/lib/auth/require-user";
import { canManageBomCategory } from "@/lib/bom/permissions";
import { resolveSubsystemCategory } from "@/lib/vehicle/resolve-category";
import { createClient } from "@/lib/supabase/server";
import { getCategory } from "@/services/vehicle-service";

import {
  createAssemblySchema,
  createSubsystemSchema,
  createVehicleSchema,
  updateAssemblySchema,
  updateSubsystemSchema,
} from "./schemas";

export interface VehicleActionState {
  error?: string;
  success?: boolean;
}

export async function createVehicle(
  _prevState: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  await requireRole("admin");

  const parsed = createVehicleSchema.safeParse({
    vehicleName: formData.get("vehicleName"),
    competitionYear: formData.get("competitionYear"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").insert({
    vehicle_name: parsed.data.vehicleName,
    competition_year: parsed.data.competitionYear,
  });

  if (error) {
    return { error: "차량 생성 중 오류가 발생했습니다." };
  }

  revalidatePath("/dashboard/vehicle");
  return { success: true };
}

export async function createSubsystem(
  _prevState: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  const profile = await requireUser();

  if (profile.role === "member") {
    return { error: "Subsystem을 생성할 권한이 없습니다." };
  }

  const parsed = createSubsystemSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const category = await getCategory(parsed.data.categoryId);
  if (!category || !canManageBomCategory(profile, category.name)) {
    return { error: "담당 카테고리에서만 Subsystem을 생성할 수 있습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("subsystems").insert({
    category_id: parsed.data.categoryId,
    name: parsed.data.name,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "이미 같은 이름의 Subsystem이 있습니다." : "Subsystem 생성 중 오류가 발생했습니다.",
    };
  }

  revalidatePath(`/dashboard/vehicle`);
  return { success: true };
}

export async function updateSubsystem(
  _prevState: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  const profile = await requireUser();

  if (profile.role === "member") {
    return { error: "Subsystem을 수정할 권한이 없습니다." };
  }

  const parsed = updateSubsystemSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const category = await resolveSubsystemCategory(parsed.data.id);
  if (!category || !canManageBomCategory(profile, category)) {
    return { error: "담당 카테고리의 Subsystem만 수정할 수 있습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("subsystems").update({ name: parsed.data.name }).eq("id", parsed.data.id);

  if (error) {
    return { error: "Subsystem 수정 중 오류가 발생했습니다." };
  }

  revalidatePath(`/dashboard/vehicle`);
  return { success: true };
}

export async function createAssembly(
  _prevState: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  const profile = await requireUser();

  if (profile.role === "member") {
    return { error: "Assembly를 생성할 권한이 없습니다." };
  }

  const parsed = createAssemblySchema.safeParse({
    subsystemId: formData.get("subsystemId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    revision: formData.get("revision") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const category = await resolveSubsystemCategory(parsed.data.subsystemId);
  if (!category || !canManageBomCategory(profile, category)) {
    return { error: "담당 카테고리에서만 Assembly를 생성할 수 있습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("assemblies").insert({
    subsystem_id: parsed.data.subsystemId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    revision: parsed.data.revision ?? "A",
  });

  if (error) {
    return {
      error: error.code === "23505" ? "이미 같은 이름의 Assembly가 있습니다." : "Assembly 생성 중 오류가 발생했습니다.",
    };
  }

  revalidatePath(`/dashboard/vehicle`);
  return { success: true };
}

export async function updateAssembly(
  _prevState: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  const profile = await requireUser();

  if (profile.role === "member") {
    return { error: "Assembly를 수정할 권한이 없습니다." };
  }

  const parsed = updateAssemblySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    revision: formData.get("revision"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase.from("assemblies").select("subsystem_id").eq("id", parsed.data.id).single();

  if (!existing) {
    return { error: "Assembly를 찾을 수 없습니다." };
  }

  const category = await resolveSubsystemCategory(existing.subsystem_id);
  if (!category || !canManageBomCategory(profile, category)) {
    return { error: "담당 카테고리의 Assembly만 수정할 수 있습니다." };
  }

  const { error } = await supabase
    .from("assemblies")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      revision: parsed.data.revision,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: "Assembly 수정 중 오류가 발생했습니다." };
  }

  revalidatePath(`/dashboard/vehicle`);
  return { success: true };
}
