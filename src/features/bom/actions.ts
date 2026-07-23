"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { canManageBomCategory } from "@/lib/bom/permissions";
import { createClient } from "@/lib/supabase/server";
import { deleteBomFiles, getBomFileSignedUrl } from "@/lib/supabase/storage";
import { resolveAssemblyCategory } from "@/lib/vehicle/resolve-category";
import { listPartFilesForPaths } from "@/services/part-file-service";
import { listPartRevisions, type BomPartRevision } from "@/services/bom-service";

import { partFormSchema } from "./schemas";

export interface BomActionState {
  error?: string;
  success?: boolean;
}

function revalidateVehiclePaths() {
  revalidatePath("/dashboard/vehicle", "layout");
}

function parsePartForm(formData: FormData) {
  return partFormSchema.safeParse({
    assemblyId: formData.get("assemblyId"),
    partNumber: formData.get("partNumber"),
    partName: formData.get("partName"),
    revision: formData.get("revision"),
    material: formData.get("material") || undefined,
    weight: formData.get("weight") || undefined,
    manufacturingStatus: formData.get("manufacturingStatus"),
    ownerId: formData.get("ownerId") || undefined,
    supplier: formData.get("supplier") || undefined,
    description: formData.get("description") || undefined,
    inventoryItemId: formData.get("inventoryItemId") || undefined,
    assetId: formData.get("assetId") || undefined,
    materialQuantity: formData.get("materialQuantity") || undefined,
  });
}

export async function createPart(_prevState: BomActionState, formData: FormData): Promise<BomActionState> {
  const profile = await requireUser();

  if (profile.role === "member") {
    return { error: "부품을 생성할 권한이 없습니다." };
  }

  const parsed = parsePartForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const category = await resolveAssemblyCategory(parsed.data.assemblyId);
  if (!category || !canManageBomCategory(profile, category)) {
    return { error: "담당 카테고리의 Assembly에만 부품을 생성할 수 있습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("bom_parts").insert({
    assembly_id: parsed.data.assemblyId,
    part_number: parsed.data.partNumber,
    part_name: parsed.data.partName,
    revision: parsed.data.revision,
    material: parsed.data.material ?? null,
    weight: parsed.data.weight ?? null,
    manufacturing_status: parsed.data.manufacturingStatus,
    owner_id: parsed.data.ownerId ?? null,
    supplier: parsed.data.supplier ?? null,
    description: parsed.data.description ?? null,
    inventory_item_id: parsed.data.inventoryItemId ?? null,
    asset_id: parsed.data.assetId ?? null,
    material_quantity: parsed.data.materialQuantity ?? 1,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "이미 존재하는 Part Number입니다." : "부품 생성 중 오류가 발생했습니다.",
    };
  }

  revalidateVehiclePaths();
  return { success: true };
}

export async function updatePart(_prevState: BomActionState, formData: FormData): Promise<BomActionState> {
  const profile = await requireUser();
  const id = formData.get("id");

  if (typeof id !== "string" || !id) {
    return { error: "잘못된 요청입니다." };
  }

  if (profile.role === "member") {
    return { error: "부품을 수정할 권한이 없습니다." };
  }

  const parsed = parsePartForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const category = await resolveAssemblyCategory(parsed.data.assemblyId);
  if (!category || !canManageBomCategory(profile, category)) {
    return { error: "담당 카테고리의 부품만 수정할 수 있습니다." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase.from("bom_parts").select("assembly_id").eq("id", id).single();

  if (!existing) {
    return { error: "부품을 찾을 수 없습니다." };
  }

  const existingCategory = await resolveAssemblyCategory(existing.assembly_id);
  if (!existingCategory || !canManageBomCategory(profile, existingCategory)) {
    return { error: "담당 카테고리의 부품만 수정할 수 있습니다." };
  }

  const { error } = await supabase
    .from("bom_parts")
    .update({
      part_number: parsed.data.partNumber,
      part_name: parsed.data.partName,
      revision: parsed.data.revision,
      material: parsed.data.material ?? null,
      weight: parsed.data.weight ?? null,
      manufacturing_status: parsed.data.manufacturingStatus,
      owner_id: parsed.data.ownerId ?? null,
      supplier: parsed.data.supplier ?? null,
      description: parsed.data.description ?? null,
      inventory_item_id: parsed.data.inventoryItemId ?? null,
      asset_id: parsed.data.assetId ?? null,
      material_quantity: parsed.data.materialQuantity ?? 1,
    })
    .eq("id", id);

  if (error) {
    return {
      error: error.code === "23505" ? "이미 존재하는 Part Number입니다." : "부품 수정 중 오류가 발생했습니다.",
    };
  }

  revalidateVehiclePaths();
  return { success: true };
}

export async function deletePart(partId: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  if (profile.role !== "admin") {
    return { error: "삭제 권한이 없습니다." };
  }

  const supabase = await createClient();

  const filePaths = await listPartFilesForPaths(partId);

  const { error } = await supabase.from("bom_parts").delete().eq("id", partId);

  if (error) {
    return {
      error:
        error.code === "23503"
          ? "재고 또는 입출고 이력이 남아있어 삭제할 수 없습니다. 재고 항목을 먼저 정리해주세요."
          : "삭제 중 오류가 발생했습니다.",
    };
  }

  await deleteBomFiles(filePaths);

  revalidateVehiclePaths();
  return {};
}

export async function getDownloadUrl(path: string): Promise<string | null> {
  await requireUser();
  return getBomFileSignedUrl(path);
}

export async function fetchPartRevisions(partId: string): Promise<BomPartRevision[]> {
  await requireUser();
  return listPartRevisions(partId);
}
