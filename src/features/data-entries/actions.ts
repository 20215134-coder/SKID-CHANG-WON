"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { extractFileExtension, isAllowedDocumentFile } from "@/lib/general-documents/constants";
import { createClient } from "@/lib/supabase/server";
import { deleteDataEntryFile as removeDataEntryStorageFile, getDataEntryFileSignedUrl, uploadDataEntryFile as uploadDataEntryStorageFile } from "@/lib/supabase/storage";
import { getDataEntry, listDataEntryFiles } from "@/services/data-entry-service";

import { createDataEntrySchema, updateDataEntrySchema } from "./schemas";

export interface DataEntryActionState {
  error?: string;
  success?: boolean;
}

function revalidateDataPaths() {
  revalidatePath("/dashboard/data", "layout");
}

function collectAttachments(formData: FormData): File[] {
  return formData.getAll("attachments").filter((value): value is File => value instanceof File && value.size > 0);
}

async function uploadEntryFiles(dataEntryId: string, files: File[], uploadedBy: string) {
  const supabase = await createClient();

  for (const file of files) {
    if (!isAllowedDocumentFile(file.name)) continue;

    let storagePath: string;
    try {
      storagePath = await uploadDataEntryStorageFile(file);
    } catch {
      continue;
    }

    const { error } = await supabase.from("data_entry_files").insert({
      data_entry_id: dataEntryId,
      file_name: file.name,
      file_type: extractFileExtension(file.name),
      storage_path: storagePath,
      file_size: file.size,
      uploaded_by: uploadedBy,
    });

    if (error) {
      await removeDataEntryStorageFile(storagePath);
    }
  }
}

export async function createDataEntry(_prevState: DataEntryActionState, formData: FormData): Promise<DataEntryActionState> {
  const profile = await requireUser();

  if (profile.role === "member") {
    return { error: "데이터를 등록할 권한이 없습니다." };
  }

  const parsed = createDataEntrySchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    relatedVehicleId: formData.get("relatedVehicleId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("data_entries")
    .insert({
      category: parsed.data.category,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      related_vehicle_id: parsed.data.relatedVehicleId ?? null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: "데이터 등록 중 오류가 발생했습니다." };
  }

  await uploadEntryFiles(created.id, collectAttachments(formData), profile.id);

  revalidateDataPaths();
  return { success: true };
}

export async function updateDataEntry(_prevState: DataEntryActionState, formData: FormData): Promise<DataEntryActionState> {
  const profile = await requireUser();

  if (profile.role === "member") {
    return { error: "데이터를 수정할 권한이 없습니다." };
  }

  const parsed = updateDataEntrySchema.safeParse({
    id: formData.get("id"),
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    relatedVehicleId: formData.get("relatedVehicleId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("data_entries")
    .update({
      category: parsed.data.category,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      related_vehicle_id: parsed.data.relatedVehicleId ?? null,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: "수정 중 오류가 발생했습니다." };
  }

  await uploadEntryFiles(parsed.data.id, collectAttachments(formData), profile.id);

  revalidateDataPaths();
  return { success: true };
}

export async function deleteDataEntry(id: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  if (profile.role !== "admin") {
    return { error: "삭제 권한이 없습니다." };
  }

  const existing = await getDataEntry(id);
  if (!existing) {
    return { error: "데이터를 찾을 수 없습니다." };
  }

  const files = await listDataEntryFiles(id);

  const supabase = await createClient();
  const { error } = await supabase.from("data_entries").delete().eq("id", id);

  if (error) {
    return { error: "삭제 중 오류가 발생했습니다." };
  }

  await Promise.all(files.map((file) => removeDataEntryStorageFile(file.storagePath)));

  revalidateDataPaths();
  return {};
}

export async function removeDataEntryFile(fileId: string, dataEntryId: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  if (profile.role === "member") {
    return { error: "삭제 권한이 없습니다." };
  }

  const files = await listDataEntryFiles(dataEntryId);
  const file = files.find((item) => item.id === fileId);
  if (!file) {
    return { error: "파일을 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("data_entry_files").delete().eq("id", fileId);

  if (error) {
    return { error: "삭제 중 오류가 발생했습니다." };
  }

  await removeDataEntryStorageFile(file.storagePath);

  revalidateDataPaths();
  return {};
}

export async function getDataEntryFileDownloadUrl(path: string): Promise<string | null> {
  await requireUser();
  return getDataEntryFileSignedUrl(path);
}
