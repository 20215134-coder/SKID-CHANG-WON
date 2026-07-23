"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { deleteGeneralDocumentFile, getGeneralDocumentFileSignedUrl, uploadGeneralDocumentFile } from "@/lib/supabase/storage";
import { extractFileExtension, isAllowedDocumentFile } from "@/lib/general-documents/constants";
import { getGeneralDocument } from "@/services/general-document-service";

import { updateGeneralDocumentSchema, uploadGeneralDocumentSchema } from "./schemas";

export interface GeneralDocumentActionState {
  error?: string;
  success?: boolean;
}

function canManageDocuments(role: string): boolean {
  return role === "admin" || role === "leader";
}

function revalidateFilesPaths() {
  revalidatePath("/dashboard/files", "layout");
}

export async function uploadGeneralDocument(
  _prevState: GeneralDocumentActionState,
  formData: FormData,
): Promise<GeneralDocumentActionState> {
  const profile = await requireUser();

  if (!canManageDocuments(profile.role)) {
    return { error: "문서를 업로드할 권한이 없습니다." };
  }

  const parsed = uploadGeneralDocumentSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "업로드할 파일을 선택해주세요." };
  }
  if (!isAllowedDocumentFile(file.name)) {
    return { error: "지원하지 않는 파일 형식입니다." };
  }

  let storagePath: string;
  try {
    storagePath = await uploadGeneralDocumentFile(file);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "파일 업로드에 실패했습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("general_documents").insert({
    category: parsed.data.category,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    file_name: file.name,
    file_type: extractFileExtension(file.name),
    storage_path: storagePath,
    file_size: file.size,
    uploaded_by: profile.id,
  });

  if (error) {
    await deleteGeneralDocumentFile(storagePath);
    return { error: "문서 등록 중 오류가 발생했습니다." };
  }

  revalidateFilesPaths();
  return { success: true };
}

export async function updateGeneralDocument(
  _prevState: GeneralDocumentActionState,
  formData: FormData,
): Promise<GeneralDocumentActionState> {
  const profile = await requireUser();

  if (!canManageDocuments(profile.role)) {
    return { error: "문서를 수정할 권한이 없습니다." };
  }

  const parsed = updateGeneralDocumentSchema.safeParse({
    id: formData.get("id"),
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("general_documents")
    .update({
      category: parsed.data.category,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: "문서 수정 중 오류가 발생했습니다." };
  }

  revalidateFilesPaths();
  return { success: true };
}

export async function deleteGeneralDocument(id: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  if (profile.role !== "admin") {
    return { error: "삭제 권한이 없습니다." };
  }

  const existing = await getGeneralDocument(id);
  if (!existing) {
    return { error: "문서를 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("general_documents").delete().eq("id", id);

  if (error) {
    return { error: "삭제 중 오류가 발생했습니다." };
  }

  await deleteGeneralDocumentFile(existing.storagePath);

  revalidateFilesPaths();
  return {};
}

export async function getGeneralDocumentDownloadUrl(path: string): Promise<string | null> {
  await requireUser();
  return getGeneralDocumentFileSignedUrl(path);
}
