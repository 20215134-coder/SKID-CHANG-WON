"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { canManagePurchasing } from "@/lib/purchasing/permissions";
import { isAllowedPurchaseFile } from "@/lib/purchasing/constants";
import { createClient } from "@/lib/supabase/server";
import { deletePurchaseFile, getPurchaseFileSignedUrl, uploadPurchaseFile } from "@/lib/supabase/storage";
import { listAssemblies } from "@/services/assembly-service";
import { listPartOptionsForAssembly } from "@/services/bom-service";
import { getPurchaseRequest } from "@/services/purchase-service";
import { listSubsystems } from "@/services/subsystem-service";
import { listCategories, listVehicles } from "@/services/vehicle-service";
import type { PurchaseStatus, PurchaseTimelineEvent } from "@/types/database.types";

import { completePurchaseSchema, purchaseRequestFormSchema, rejectPurchaseRequestSchema } from "./schemas";

export interface PurchaseActionState {
  error?: string;
  success?: boolean;
  id?: string;
}

function revalidatePurchasingPaths() {
  revalidatePath("/dashboard/purchasing", "layout");
  revalidatePath("/dashboard");
}

async function logTimelineEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  purchaseRequestId: string,
  eventType: PurchaseTimelineEvent,
  actorId: string,
  note?: string | null,
) {
  await supabase.from("purchase_timeline").insert({
    purchase_request_id: purchaseRequestId,
    event_type: eventType,
    actor_id: actorId,
    note: note ?? null,
  });
}

function parsePurchaseRequestForm(formData: FormData) {
  return purchaseRequestFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    vehicleId: formData.get("vehicleId"),
    categoryId: formData.get("categoryId"),
    subsystemId: formData.get("subsystemId") || undefined,
    assemblyId: formData.get("assemblyId") || undefined,
    partId: formData.get("partId") || undefined,
    supplier: formData.get("supplier") || undefined,
    productUrl: formData.get("productUrl") || undefined,
    quantity: formData.get("quantity"),
    estimatedCost: formData.get("estimatedCost"),
    priority: formData.get("priority"),
  });
}

async function uploadAttachments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  purchaseRequestId: string,
  files: File[],
  uploadedBy: string,
): Promise<string | null> {
  for (const file of files) {
    if (!isAllowedPurchaseFile(file.name)) {
      return `지원하지 않는 파일 형식입니다: ${file.name}`;
    }
  }

  for (const file of files) {
    let storagePath: string;
    try {
      storagePath = await uploadPurchaseFile(file);
    } catch (error) {
      return error instanceof Error ? error.message : "파일 업로드에 실패했습니다.";
    }

    const { error } = await supabase.from("purchase_request_files").insert({
      purchase_request_id: purchaseRequestId,
      file_name: file.name,
      file_type: file.name.split(".").pop()?.toLowerCase() ?? "",
      storage_path: storagePath,
      file_size: file.size,
      uploaded_by: uploadedBy,
    });

    if (error) {
      await deletePurchaseFile(storagePath);
      return "첨부 파일 등록 중 오류가 발생했습니다.";
    }
  }

  return null;
}

export async function createPurchaseRequest(
  _prevState: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  const profile = await requireUser();

  const parsed = parsePurchaseRequestForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const intent = formData.get("intent") === "submit" ? "submit" : "draft";
  const status: PurchaseStatus = intent === "submit" ? "pending_approval" : "draft";

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("purchase_requests")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      vehicle_id: parsed.data.vehicleId,
      category_id: parsed.data.categoryId,
      subsystem_id: parsed.data.subsystemId ?? null,
      assembly_id: parsed.data.assemblyId ?? null,
      part_id: parsed.data.partId ?? null,
      supplier: parsed.data.supplier ?? null,
      product_url: parsed.data.productUrl ?? null,
      quantity: parsed.data.quantity,
      estimated_cost: parsed.data.estimatedCost,
      priority: parsed.data.priority,
      status,
      requested_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: "구매 요청 생성 중 오류가 발생했습니다." };
  }

  await logTimelineEvent(supabase, created.id, "created", profile.id);
  if (intent === "submit") {
    await logTimelineEvent(supabase, created.id, "submitted", profile.id);
  }

  const files = formData.getAll("attachments").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length > 0) {
    const uploadError = await uploadAttachments(supabase, created.id, files, profile.id);
    if (uploadError) {
      return { error: uploadError };
    }
  }

  revalidatePurchasingPaths();
  return { success: true, id: created.id };
}

export async function updatePurchaseRequest(
  _prevState: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  const profile = await requireUser();
  const id = formData.get("id");

  if (typeof id !== "string" || !id) {
    return { error: "잘못된 요청입니다." };
  }

  const existing = await getPurchaseRequest(id);
  if (!existing) {
    return { error: "구매 요청을 찾을 수 없습니다." };
  }
  if (existing.requestedById !== profile.id || existing.status !== "draft") {
    return { error: "임시 저장 상태의 본인 요청만 수정할 수 있습니다." };
  }

  const parsed = parsePurchaseRequestForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const intent = formData.get("intent") === "submit" ? "submit" : "draft";
  const supabase = await createClient();

  const { error } = await supabase
    .from("purchase_requests")
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      vehicle_id: parsed.data.vehicleId,
      category_id: parsed.data.categoryId,
      subsystem_id: parsed.data.subsystemId ?? null,
      assembly_id: parsed.data.assemblyId ?? null,
      part_id: parsed.data.partId ?? null,
      supplier: parsed.data.supplier ?? null,
      product_url: parsed.data.productUrl ?? null,
      quantity: parsed.data.quantity,
      estimated_cost: parsed.data.estimatedCost,
      priority: parsed.data.priority,
      status: intent === "submit" ? "pending_approval" : "draft",
    })
    .eq("id", id);

  if (error) {
    return { error: "구매 요청 수정 중 오류가 발생했습니다." };
  }

  if (intent === "submit") {
    await logTimelineEvent(supabase, id, "submitted", profile.id);
  }

  revalidatePurchasingPaths();
  return { success: true, id };
}

export async function submitPurchaseRequest(id: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  const existing = await getPurchaseRequest(id);
  if (!existing) return { error: "구매 요청을 찾을 수 없습니다." };
  if (existing.requestedById !== profile.id || existing.status !== "draft") {
    return { error: "임시 저장 상태의 본인 요청만 제출할 수 있습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("purchase_requests").update({ status: "pending_approval" }).eq("id", id);
  if (error) return { error: "제출 중 오류가 발생했습니다." };

  await logTimelineEvent(supabase, id, "submitted", profile.id);
  revalidatePurchasingPaths();
  return {};
}

export async function approvePurchaseRequest(id: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  if (!canManagePurchasing(profile)) {
    return { error: "승인 권한이 없습니다." };
  }

  const existing = await getPurchaseRequest(id);
  if (!existing) return { error: "구매 요청을 찾을 수 없습니다." };
  if (existing.status !== "pending_approval") {
    return { error: "승인 대기 상태의 요청만 승인할 수 있습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("purchase_requests")
    .update({ status: "approved", approved_by: profile.id, approved_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: "승인 중 오류가 발생했습니다." };

  await logTimelineEvent(supabase, id, "approved", profile.id);
  revalidatePurchasingPaths();
  return {};
}

export async function rejectPurchaseRequest(
  _prevState: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  const profile = await requireUser();

  if (!canManagePurchasing(profile)) {
    return { error: "반려 권한이 없습니다." };
  }

  const parsed = rejectPurchaseRequestSchema.safeParse({
    id: formData.get("id"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const existing = await getPurchaseRequest(parsed.data.id);
  if (!existing) return { error: "구매 요청을 찾을 수 없습니다." };
  if (existing.status !== "pending_approval") {
    return { error: "승인 대기 상태의 요청만 반려할 수 있습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("purchase_requests")
    .update({ status: "rejected", approved_by: profile.id, approved_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  if (error) return { error: "반려 중 오류가 발생했습니다." };

  await logTimelineEvent(supabase, parsed.data.id, "rejected", profile.id, parsed.data.reason);
  revalidatePurchasingPaths();
  return { success: true };
}

export async function completePurchase(
  _prevState: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  const profile = await requireUser();

  if (!canManagePurchasing(profile)) {
    return { error: "구매 완료 처리 권한이 없습니다." };
  }

  const parsed = completePurchaseSchema.safeParse({
    id: formData.get("id"),
    finalCost: formData.get("finalCost"),
    purchasedAt: formData.get("purchasedAt"),
    purchaseNotes: formData.get("purchaseNotes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const existing = await getPurchaseRequest(parsed.data.id);
  if (!existing) return { error: "구매 요청을 찾을 수 없습니다." };
  if (existing.status !== "approved") {
    return { error: "승인된 요청만 구매 완료 처리할 수 있습니다." };
  }

  const receiptFile = formData.get("receiptFile");
  if (!(receiptFile instanceof File) || receiptFile.size === 0) {
    return { error: "영수증 파일을 첨부해주세요." };
  }
  if (!isAllowedPurchaseFile(receiptFile.name)) {
    return { error: "영수증은 PDF, PNG, JPG 형식만 지원합니다." };
  }

  let receiptPath: string;
  try {
    receiptPath = await uploadPurchaseFile(receiptFile);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "영수증 업로드에 실패했습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("purchase_requests")
    .update({
      status: "purchased",
      final_cost: parsed.data.finalCost,
      purchased_at: new Date(parsed.data.purchasedAt).toISOString(),
      purchase_notes: parsed.data.purchaseNotes ?? null,
      purchased_by: profile.id,
      receipt_file: receiptPath,
    })
    .eq("id", parsed.data.id);

  if (error) {
    await deletePurchaseFile(receiptPath);
    return { error: "구매 완료 처리 중 오류가 발생했습니다." };
  }

  await logTimelineEvent(supabase, parsed.data.id, "purchased", profile.id, parsed.data.purchaseNotes ?? null);
  revalidatePurchasingPaths();
  return { success: true };
}

export async function updateReceiptFile(
  _prevState: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  const profile = await requireUser();

  if (!canManagePurchasing(profile)) {
    return { error: "영수증을 수정할 권한이 없습니다." };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "잘못된 요청입니다." };
  }

  const existing = await getPurchaseRequest(id);
  if (!existing) return { error: "구매 요청을 찾을 수 없습니다." };
  if (existing.status !== "purchased") {
    return { error: "구매 완료된 요청만 영수증을 수정할 수 있습니다." };
  }

  const receiptFile = formData.get("receiptFile");
  if (!(receiptFile instanceof File) || receiptFile.size === 0) {
    return { error: "새 영수증 파일을 선택해주세요." };
  }
  if (!isAllowedPurchaseFile(receiptFile.name)) {
    return { error: "영수증은 PDF, PNG, JPG 형식만 지원합니다." };
  }

  let receiptPath: string;
  try {
    receiptPath = await uploadPurchaseFile(receiptFile);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "영수증 업로드에 실패했습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("purchase_requests").update({ receipt_file: receiptPath }).eq("id", id);

  if (error) {
    await deletePurchaseFile(receiptPath);
    return { error: "영수증 수정 중 오류가 발생했습니다." };
  }

  if (existing.receiptFile) {
    await deletePurchaseFile(existing.receiptFile);
  }

  await logTimelineEvent(supabase, id, "receipt_updated", profile.id);
  revalidatePurchasingPaths();
  return { success: true };
}

export async function cancelPurchaseRequest(id: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  const existing = await getPurchaseRequest(id);
  if (!existing) return { error: "구매 요청을 찾을 수 없습니다." };

  const isOwner = existing.requestedById === profile.id;
  const manages = canManagePurchasing(profile);

  if (!isOwner && !manages) {
    return { error: "취소 권한이 없습니다." };
  }

  const cancellableStatuses: PurchaseStatus[] = manages
    ? ["draft", "pending_approval", "approved"]
    : ["draft", "pending_approval"];

  if (!cancellableStatuses.includes(existing.status)) {
    return { error: "이 상태의 요청은 취소할 수 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("purchase_requests").update({ status: "cancelled" }).eq("id", id);
  if (error) return { error: "취소 중 오류가 발생했습니다." };

  await logTimelineEvent(supabase, id, "cancelled", profile.id);
  revalidatePurchasingPaths();
  return {};
}

export async function uploadPurchaseRequestFiles(
  _prevState: PurchaseActionState,
  formData: FormData,
): Promise<PurchaseActionState> {
  const profile = await requireUser();
  const purchaseRequestId = formData.get("purchaseRequestId");

  if (typeof purchaseRequestId !== "string" || !purchaseRequestId) {
    return { error: "잘못된 요청입니다." };
  }

  const existing = await getPurchaseRequest(purchaseRequestId);
  if (!existing) return { error: "구매 요청을 찾을 수 없습니다." };
  if (existing.requestedById !== profile.id && !canManagePurchasing(profile)) {
    return { error: "첨부 파일을 추가할 권한이 없습니다." };
  }

  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) {
    return { error: "업로드할 파일을 선택해주세요." };
  }

  const supabase = await createClient();
  const uploadError = await uploadAttachments(supabase, purchaseRequestId, files, profile.id);
  if (uploadError) {
    return { error: uploadError };
  }

  revalidatePurchasingPaths();
  return { success: true };
}

export async function deletePurchaseRequestFile(fileId: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  const supabase = await createClient();
  const { data: file } = await supabase
    .from("purchase_request_files")
    .select("id, purchase_request_id, storage_path")
    .eq("id", fileId)
    .single();

  if (!file) return { error: "파일을 찾을 수 없습니다." };

  const existing = await getPurchaseRequest(file.purchase_request_id);
  if (!existing) return { error: "구매 요청을 찾을 수 없습니다." };

  const canDelete = canManagePurchasing(profile) || (existing.requestedById === profile.id && existing.status === "draft");
  if (!canDelete) {
    return { error: "삭제 권한이 없습니다." };
  }

  const { error } = await supabase.from("purchase_request_files").delete().eq("id", fileId);
  if (error) return { error: "삭제 중 오류가 발생했습니다." };

  await deletePurchaseFile(file.storage_path);
  revalidatePurchasingPaths();
  return {};
}

export async function getPurchaseFileDownloadUrl(path: string): Promise<string | null> {
  await requireUser();
  return getPurchaseFileSignedUrl(path);
}

export async function fetchVehicleOptions() {
  await requireUser();
  return listVehicles();
}

export async function fetchCategoriesForVehicle(vehicleId: string) {
  await requireUser();
  return listCategories(vehicleId);
}

export async function fetchSubsystemsForCategory(categoryId: string) {
  await requireUser();
  return listSubsystems(categoryId);
}

export async function fetchAssembliesForSubsystem(subsystemId: string) {
  await requireUser();
  return listAssemblies(subsystemId);
}

export async function fetchPartOptionsForAssembly(assemblyId: string) {
  await requireUser();
  return listPartOptionsForAssembly(assemblyId);
}
