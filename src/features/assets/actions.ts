"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { getAsset } from "@/services/asset-service";

import { createAssetSchema, updateAssetSchema } from "./schemas";

export interface AssetActionState {
  error?: string;
  success?: boolean;
}

function canManageAssets(role: string): boolean {
  return role === "admin" || role === "leader";
}

function revalidateAssetPaths() {
  revalidatePath("/dashboard/assets", "layout");
  revalidatePath("/dashboard");
}

export async function createAsset(_prevState: AssetActionState, formData: FormData): Promise<AssetActionState> {
  const profile = await requireUser();

  if (!canManageAssets(profile.role)) {
    return { error: "자산을 등록할 권한이 없습니다." };
  }

  const parsed = createAssetSchema.safeParse({
    assetNumber: formData.get("assetNumber"),
    assetName: formData.get("assetName"),
    engineeringCategory: formData.get("engineeringCategory") || undefined,
    description: formData.get("description") || undefined,
    currentCondition: formData.get("currentCondition"),
    purchaseDate: formData.get("purchaseDate") || undefined,
    purchaseCost: formData.get("purchaseCost") || undefined,
    assignedTo: formData.get("assignedTo") || undefined,
    notes: formData.get("notes") || undefined,
    sourcePurchaseRequestId: formData.get("sourcePurchaseRequestId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("assets").insert({
    asset_number: parsed.data.assetNumber,
    asset_name: parsed.data.assetName,
    engineering_category: parsed.data.engineeringCategory ?? null,
    description: parsed.data.description ?? null,
    current_condition: parsed.data.currentCondition,
    purchase_date: parsed.data.purchaseDate ?? null,
    purchase_cost: parsed.data.purchaseCost ?? null,
    assigned_to: parsed.data.assignedTo ?? null,
    notes: parsed.data.notes ?? null,
    source_purchase_request_id: parsed.data.sourcePurchaseRequestId ?? null,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "이미 존재하는 자산 번호입니다." : "자산 등록 중 오류가 발생했습니다.",
    };
  }

  revalidateAssetPaths();
  return { success: true };
}

export async function updateAsset(_prevState: AssetActionState, formData: FormData): Promise<AssetActionState> {
  const profile = await requireUser();

  if (!canManageAssets(profile.role)) {
    return { error: "자산을 수정할 권한이 없습니다." };
  }

  const parsed = updateAssetSchema.safeParse({
    id: formData.get("id"),
    assetNumber: formData.get("assetNumber"),
    assetName: formData.get("assetName"),
    engineeringCategory: formData.get("engineeringCategory") || undefined,
    description: formData.get("description") || undefined,
    currentCondition: formData.get("currentCondition"),
    purchaseDate: formData.get("purchaseDate") || undefined,
    purchaseCost: formData.get("purchaseCost") || undefined,
    assignedTo: formData.get("assignedTo") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const asset = await getAsset(parsed.data.id);
  if (!asset) {
    return { error: "자산을 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("assets")
    .update({
      asset_number: parsed.data.assetNumber,
      asset_name: parsed.data.assetName,
      engineering_category: parsed.data.engineeringCategory ?? null,
      description: parsed.data.description ?? null,
      current_condition: parsed.data.currentCondition,
      purchase_date: parsed.data.purchaseDate ?? null,
      purchase_cost: parsed.data.purchaseCost ?? null,
      assigned_to: parsed.data.assignedTo ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return {
      error: error.code === "23505" ? "이미 존재하는 자산 번호입니다." : "자산 수정 중 오류가 발생했습니다.",
    };
  }

  revalidateAssetPaths();
  return { success: true };
}

export async function deleteAsset(id: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  if (profile.role !== "admin") {
    return { error: "삭제 권한이 없습니다." };
  }

  const asset = await getAsset(id);
  if (!asset) {
    return { error: "자산을 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("assets").delete().eq("id", id);

  if (error) {
    return { error: "삭제 중 오류가 발생했습니다." };
  }

  revalidateAssetPaths();
  return {};
}
