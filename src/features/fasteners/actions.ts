"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { canManageBomCategory } from "@/lib/bom/permissions";
import { createClient } from "@/lib/supabase/server";
import { resolveAssemblyCategory } from "@/lib/vehicle/resolve-category";

import { NEW_FASTENER_VALUE } from "./constants";
import {
  addAssemblyFastenerSchema,
  createFastenerSchema,
  updateAssemblyFastenerSchema,
  updateFastenerSchema,
} from "./schemas";

export interface FastenerActionState {
  error?: string;
  success?: boolean;
}

function revalidateVehiclePaths() {
  revalidatePath("/dashboard/vehicle", "layout");
}

function canManageFastenerCatalog(role: string): boolean {
  return role === "admin" || role === "leader";
}

export async function createFastener(_prevState: FastenerActionState, formData: FormData): Promise<FastenerActionState> {
  const profile = await requireUser();

  if (!canManageFastenerCatalog(profile.role)) {
    return { error: "체결류를 등록할 권한이 없습니다." };
  }

  const parsed = createFastenerSchema.safeParse({
    name: formData.get("name"),
    spec: formData.get("spec") || undefined,
    unitCost: formData.get("unitCost") || undefined,
    supplier: formData.get("supplier") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("fasteners").insert({
    name: parsed.data.name,
    spec: parsed.data.spec ?? null,
    unit_cost: parsed.data.unitCost ?? null,
    supplier: parsed.data.supplier ?? null,
  });

  if (error) {
    return { error: error.code === "23505" ? "이미 등록된 이름입니다." : "체결류 등록 중 오류가 발생했습니다." };
  }

  revalidateVehiclePaths();
  return { success: true };
}

export async function updateFastener(_prevState: FastenerActionState, formData: FormData): Promise<FastenerActionState> {
  const profile = await requireUser();

  if (!canManageFastenerCatalog(profile.role)) {
    return { error: "체결류를 수정할 권한이 없습니다." };
  }

  const parsed = updateFastenerSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    spec: formData.get("spec") || undefined,
    unitCost: formData.get("unitCost") || undefined,
    supplier: formData.get("supplier") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("fasteners")
    .update({
      name: parsed.data.name,
      spec: parsed.data.spec ?? null,
      unit_cost: parsed.data.unitCost ?? null,
      supplier: parsed.data.supplier ?? null,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: error.code === "23505" ? "이미 등록된 이름입니다." : "수정 중 오류가 발생했습니다." };
  }

  revalidateVehiclePaths();
  return { success: true };
}

export async function deleteFastener(id: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  if (profile.role !== "admin") {
    return { error: "삭제 권한이 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("fasteners").delete().eq("id", id);

  if (error) {
    return {
      error: error.code === "23503" ? "Assembly에서 사용 중인 체결류는 삭제할 수 없습니다." : "삭제 중 오류가 발생했습니다.",
    };
  }

  revalidateVehiclePaths();
  return {};
}

export async function addAssemblyFastener(
  _prevState: FastenerActionState,
  formData: FormData,
): Promise<FastenerActionState> {
  const profile = await requireUser();

  if (profile.role === "member") {
    return { error: "체결류를 등록할 권한이 없습니다." };
  }

  const parsed = addAssemblyFastenerSchema.safeParse({
    assemblyId: formData.get("assemblyId"),
    fastenerId: formData.get("fastenerId"),
    newFastenerName: formData.get("newFastenerName") || undefined,
    newFastenerSpec: formData.get("newFastenerSpec") || undefined,
    newFastenerUnitCost: formData.get("newFastenerUnitCost") || undefined,
    newFastenerSupplier: formData.get("newFastenerSupplier") || undefined,
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const category = await resolveAssemblyCategory(parsed.data.assemblyId);
  if (!category || !canManageBomCategory(profile, category)) {
    return { error: "담당 카테고리의 Assembly에만 체결류를 등록할 수 있습니다." };
  }

  const supabase = await createClient();
  let fastenerId = parsed.data.fastenerId;

  if (fastenerId === NEW_FASTENER_VALUE) {
    const { data: created, error: createError } = await supabase
      .from("fasteners")
      .insert({
        name: parsed.data.newFastenerName!,
        spec: parsed.data.newFastenerSpec ?? null,
        unit_cost: parsed.data.newFastenerUnitCost ?? null,
        supplier: parsed.data.newFastenerSupplier ?? null,
      })
      .select("id")
      .single();

    if (createError || !created) {
      return { error: createError?.code === "23505" ? "이미 등록된 이름입니다." : "새 체결류 등록 중 오류가 발생했습니다." };
    }

    fastenerId = created.id;
  }

  const { error } = await supabase.from("assembly_fasteners").insert({
    assembly_id: parsed.data.assemblyId,
    fastener_id: fastenerId,
    quantity: parsed.data.quantity,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "이미 등록된 체결류입니다. 수량을 수정해주세요." : "체결류 등록 중 오류가 발생했습니다.",
    };
  }

  revalidateVehiclePaths();
  return { success: true };
}

export async function updateAssemblyFastenerQuantity(
  _prevState: FastenerActionState,
  formData: FormData,
): Promise<FastenerActionState> {
  const profile = await requireUser();

  if (profile.role === "member") {
    return { error: "체결류를 수정할 권한이 없습니다." };
  }

  const parsed = updateAssemblyFastenerSchema.safeParse({
    id: formData.get("id"),
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("assembly_fasteners")
    .select("assembly_id")
    .eq("id", parsed.data.id)
    .single();

  if (!existing) {
    return { error: "체결류 항목을 찾을 수 없습니다." };
  }

  const category = await resolveAssemblyCategory(existing.assembly_id);
  if (!category || !canManageBomCategory(profile, category)) {
    return { error: "담당 카테고리의 체결류만 수정할 수 있습니다." };
  }

  const { error } = await supabase
    .from("assembly_fasteners")
    .update({ quantity: parsed.data.quantity })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: "수정 중 오류가 발생했습니다." };
  }

  revalidateVehiclePaths();
  return { success: true };
}

export async function removeAssemblyFastener(id: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  if (profile.role === "member") {
    return { error: "삭제 권한이 없습니다." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("assembly_fasteners")
    .select("assembly_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return { error: "체결류 항목을 찾을 수 없습니다." };
  }

  const category = await resolveAssemblyCategory(existing.assembly_id);
  if (!category || !canManageBomCategory(profile, category)) {
    return { error: "담당 카테고리의 체결류만 삭제할 수 있습니다." };
  }

  const { error } = await supabase.from("assembly_fasteners").delete().eq("id", id);

  if (error) {
    return { error: "삭제 중 오류가 발생했습니다." };
  }

  revalidateVehiclePaths();
  return {};
}
