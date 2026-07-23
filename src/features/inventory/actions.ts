"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { canManageInventoryItem } from "@/lib/inventory/permissions";
import { createClient } from "@/lib/supabase/server";
import { resolvePartCategory } from "@/lib/vehicle/resolve-category";
import { getInventoryItem } from "@/services/inventory-service";
import type { AuthProfile } from "@/types/auth";
import type { InventoryMovementType } from "@/types/database.types";

import {
  createInventoryItemSchema,
  stockAdjustmentSchema,
  stockMovementSchema,
  stockTransferSchema,
  updateInventoryItemSchema,
} from "./schemas";

export interface InventoryActionState {
  error?: string;
  success?: boolean;
}

function revalidateInventoryPaths() {
  revalidatePath("/dashboard/inventory", "layout");
  revalidatePath("/dashboard");
}

async function assertCanManageSubmittedScope(
  profile: AuthProfile,
  relatedPartId: string | undefined,
  owningDepartment: string | undefined,
): Promise<string | null> {
  if (profile.role === "admin") return null;
  if (profile.role !== "leader") return "재고를 관리할 권한이 없습니다.";

  const relatedPartCategory = relatedPartId ? await resolvePartCategory(relatedPartId) : null;
  const canManage = canManageInventoryItem(profile, {
    relatedPartCategory,
    owningDepartment: owningDepartment ?? null,
  });

  return canManage ? null : "담당 카테고리 또는 소속 부서의 재고만 관리할 수 있습니다.";
}

function parseCreateItemForm(formData: FormData) {
  return createInventoryItemSchema.safeParse({
    itemCode: formData.get("itemCode"),
    itemName: formData.get("itemName"),
    category: formData.get("category"),
    manufacturer: formData.get("manufacturer") || undefined,
    supplier: formData.get("supplier") || undefined,
    description: formData.get("description") || undefined,
    currentQuantity: formData.get("currentQuantity"),
    minimumQuantity: formData.get("minimumQuantity"),
    unit: formData.get("unit"),
    storageLocation: formData.get("storageLocation") || undefined,
    unitCost: formData.get("unitCost") || undefined,
    relatedPartId: formData.get("relatedPartId") || undefined,
    owningDepartment: formData.get("owningDepartment") || undefined,
    sourcePurchaseRequestId: formData.get("sourcePurchaseRequestId") || undefined,
  });
}

function parseUpdateItemForm(formData: FormData) {
  return updateInventoryItemSchema.safeParse({
    id: formData.get("id"),
    itemCode: formData.get("itemCode"),
    itemName: formData.get("itemName"),
    category: formData.get("category"),
    manufacturer: formData.get("manufacturer") || undefined,
    supplier: formData.get("supplier") || undefined,
    description: formData.get("description") || undefined,
    minimumQuantity: formData.get("minimumQuantity"),
    unit: formData.get("unit"),
    unitCost: formData.get("unitCost") || undefined,
    status: formData.get("status"),
    relatedPartId: formData.get("relatedPartId") || undefined,
    owningDepartment: formData.get("owningDepartment") || undefined,
  });
}

export async function createInventoryItem(
  _prevState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const profile = await requireUser();

  if (profile.role === "member") {
    return { error: "재고를 생성할 권한이 없습니다." };
  }

  const parsed = parseCreateItemForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const scopeError = await assertCanManageSubmittedScope(profile, parsed.data.relatedPartId, parsed.data.owningDepartment);
  if (scopeError) return { error: scopeError };

  const supabase = await createClient();
  const { error } = await supabase.from("inventory_items").insert({
    item_code: parsed.data.itemCode,
    item_name: parsed.data.itemName,
    category: parsed.data.category,
    manufacturer: parsed.data.manufacturer ?? null,
    supplier: parsed.data.supplier ?? null,
    description: parsed.data.description ?? null,
    current_quantity: parsed.data.currentQuantity,
    minimum_quantity: parsed.data.minimumQuantity,
    unit: parsed.data.unit,
    storage_location: parsed.data.storageLocation ?? null,
    unit_cost: parsed.data.unitCost ?? null,
    related_part_id: parsed.data.relatedPartId ?? null,
    owning_department: parsed.data.owningDepartment ?? null,
    source_purchase_request_id: parsed.data.sourcePurchaseRequestId ?? null,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "이미 존재하는 품목 코드입니다." : "재고 항목 생성 중 오류가 발생했습니다.",
    };
  }

  revalidateInventoryPaths();
  return { success: true };
}

export async function updateInventoryItem(
  _prevState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const profile = await requireUser();

  if (profile.role === "member") {
    return { error: "재고를 수정할 권한이 없습니다." };
  }

  const parsed = parseUpdateItemForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const existing = await getInventoryItem(parsed.data.id);
  if (!existing) {
    return { error: "재고 항목을 찾을 수 없습니다." };
  }

  if (!canManageInventoryItem(profile, existing)) {
    return { error: "담당 카테고리 또는 소속 부서의 재고만 수정할 수 있습니다." };
  }

  const scopeError = await assertCanManageSubmittedScope(profile, parsed.data.relatedPartId, parsed.data.owningDepartment);
  if (scopeError) return { error: scopeError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory_items")
    .update({
      item_code: parsed.data.itemCode,
      item_name: parsed.data.itemName,
      category: parsed.data.category,
      manufacturer: parsed.data.manufacturer ?? null,
      supplier: parsed.data.supplier ?? null,
      description: parsed.data.description ?? null,
      minimum_quantity: parsed.data.minimumQuantity,
      unit: parsed.data.unit,
      unit_cost: parsed.data.unitCost ?? null,
      status: parsed.data.status,
      related_part_id: parsed.data.relatedPartId ?? null,
      owning_department: parsed.data.owningDepartment ?? null,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return {
      error: error.code === "23505" ? "이미 존재하는 품목 코드입니다." : "재고 항목 수정 중 오류가 발생했습니다.",
    };
  }

  revalidateInventoryPaths();
  return { success: true };
}

export async function deleteInventoryItem(id: string): Promise<{ error?: string }> {
  const profile = await requireUser();
  if (profile.role !== "admin") {
    return { error: "삭제 권한이 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("inventory_items").delete().eq("id", id);

  if (error) {
    return {
      error:
        error.code === "23503"
          ? "이동 이력 또는 연결된 자산이 있어 삭제할 수 없습니다."
          : "삭제 중 오류가 발생했습니다.",
    };
  }

  revalidateInventoryPaths();
  return {};
}

async function recordMovement(
  itemId: string,
  movementType: InventoryMovementType,
  args: { quantity?: number; reason?: string | null; newQuantity?: number; newLocation?: string },
): Promise<InventoryActionState> {
  await requireUser();

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_inventory_movement", {
    p_item_id: itemId,
    p_movement_type: movementType,
    p_quantity: args.quantity ?? null,
    p_reason: args.reason ?? null,
    p_new_quantity: args.newQuantity ?? null,
    p_new_location: args.newLocation ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateInventoryPaths();
  return { success: true };
}

export async function stockIn(_prevState: InventoryActionState, formData: FormData): Promise<InventoryActionState> {
  const parsed = stockMovementSchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  return recordMovement(parsed.data.itemId, "in", { quantity: parsed.data.quantity, reason: parsed.data.reason });
}

export async function stockOut(_prevState: InventoryActionState, formData: FormData): Promise<InventoryActionState> {
  const parsed = stockMovementSchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  return recordMovement(parsed.data.itemId, "out", { quantity: parsed.data.quantity, reason: parsed.data.reason });
}

export async function adjustStock(_prevState: InventoryActionState, formData: FormData): Promise<InventoryActionState> {
  const profile = await requireUser();
  if (profile.role !== "admin") {
    return { error: "Adjustment는 관리자만 가능합니다." };
  }

  const parsed = stockAdjustmentSchema.safeParse({
    itemId: formData.get("itemId"),
    newQuantity: formData.get("newQuantity"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  return recordMovement(parsed.data.itemId, "adjustment", { newQuantity: parsed.data.newQuantity, reason: parsed.data.reason });
}

export async function transferStock(_prevState: InventoryActionState, formData: FormData): Promise<InventoryActionState> {
  const parsed = stockTransferSchema.safeParse({
    itemId: formData.get("itemId"),
    newLocation: formData.get("newLocation"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  return recordMovement(parsed.data.itemId, "transfer", { newLocation: parsed.data.newLocation, reason: parsed.data.reason });
}
