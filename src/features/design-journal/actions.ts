"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { canDeleteDesignJournal, canEditDesignJournal } from "@/lib/design-journal/permissions";
import { extractFileExtension, isAllowedDesignJournalFile } from "@/lib/design-journal/constants";
import { sanitizeJournalHtml } from "@/lib/editor/sanitize";
import { createClient } from "@/lib/supabase/server";
import {
  deleteDesignJournalFile as removeDesignJournalStorageFile,
  getDesignJournalFileSignedUrl,
  uploadDesignJournalFile as uploadDesignJournalStorageFile,
} from "@/lib/supabase/storage";
import { getDesignJournal, listDesignJournalFiles } from "@/services/design-journal-service";

import { designJournalFormSchema, updateDesignJournalFormSchema } from "./schemas";

export interface DesignJournalActionState {
  error?: string;
  success?: boolean;
  id?: string;
}

function revalidateDesignJournalPaths(id?: string) {
  revalidatePath("/dashboard/design-journal", "layout");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/dashboard/design-journal/${id}`);
}

function parseCreateForm(formData: FormData) {
  return designJournalFormSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    vehicleId: formData.get("vehicleId"),
    engineeringCategory: formData.get("engineeringCategory"),
    subsystemId: formData.get("subsystemId") || undefined,
    assemblyId: formData.get("assemblyId") || undefined,
    tags: formData.get("tags") || undefined,
  });
}

async function uploadJournalFiles(journalId: string, files: File[], uploadedBy: string) {
  const supabase = await createClient();

  for (const file of files) {
    if (file.size === 0 || !isAllowedDesignJournalFile(file.name)) continue;

    let storagePath: string;
    try {
      storagePath = await uploadDesignJournalStorageFile(file);
    } catch {
      continue;
    }

    const { error } = await supabase.from("design_journal_files").insert({
      journal_id: journalId,
      file_name: file.name,
      file_type: extractFileExtension(file.name),
      storage_path: storagePath,
      file_size: file.size,
      uploaded_by: uploadedBy,
    });

    if (error) {
      await removeDesignJournalStorageFile(storagePath);
    }
  }
}

function collectAttachments(formData: FormData): File[] {
  return formData.getAll("attachments").filter((value): value is File => value instanceof File && value.size > 0);
}

export async function createDesignJournal(
  _prevState: DesignJournalActionState,
  formData: FormData,
): Promise<DesignJournalActionState> {
  const profile = await requireUser();

  const parsed = parseCreateForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("design_journals")
    .insert({
      title: parsed.data.title,
      content: sanitizeJournalHtml(parsed.data.content),
      author_id: profile.id,
      vehicle_id: parsed.data.vehicleId,
      engineering_category: parsed.data.engineeringCategory,
      subsystem_id: parsed.data.subsystemId ?? null,
      assembly_id: parsed.data.assemblyId ?? null,
      tags: parsed.data.tags,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: "게시글 작성 중 오류가 발생했습니다." };
  }

  await uploadJournalFiles(inserted.id, collectAttachments(formData), profile.id);

  revalidateDesignJournalPaths(inserted.id);
  return { success: true, id: inserted.id };
}

export async function updateDesignJournal(
  _prevState: DesignJournalActionState,
  formData: FormData,
): Promise<DesignJournalActionState> {
  const profile = await requireUser();

  const parsed = updateDesignJournalFormSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    content: formData.get("content"),
    vehicleId: formData.get("vehicleId"),
    engineeringCategory: formData.get("engineeringCategory"),
    subsystemId: formData.get("subsystemId") || undefined,
    assemblyId: formData.get("assemblyId") || undefined,
    tags: formData.get("tags") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const existing = await getDesignJournal(parsed.data.id);
  if (!existing) {
    return { error: "게시글을 찾을 수 없습니다." };
  }

  if (!canEditDesignJournal(profile, existing)) {
    return { error: "이 게시글을 수정할 권한이 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("design_journals")
    .update({
      title: parsed.data.title,
      content: sanitizeJournalHtml(parsed.data.content),
      vehicle_id: parsed.data.vehicleId,
      engineering_category: parsed.data.engineeringCategory,
      subsystem_id: parsed.data.subsystemId ?? null,
      assembly_id: parsed.data.assemblyId ?? null,
      tags: parsed.data.tags,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: "게시글 수정 중 오류가 발생했습니다." };
  }

  await uploadJournalFiles(parsed.data.id, collectAttachments(formData), profile.id);

  revalidateDesignJournalPaths(parsed.data.id);
  return { success: true, id: parsed.data.id };
}

export async function deleteDesignJournal(id: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  const existing = await getDesignJournal(id);
  if (!existing) {
    return { error: "게시글을 찾을 수 없습니다." };
  }

  if (!canDeleteDesignJournal(profile, existing)) {
    return { error: "이 게시글을 삭제할 권한이 없습니다." };
  }

  const files = await listDesignJournalFiles(id);

  const supabase = await createClient();
  const { error } = await supabase.from("design_journals").delete().eq("id", id);

  if (error) {
    return { error: "삭제 중 오류가 발생했습니다." };
  }

  await Promise.all(files.map((file) => removeDesignJournalStorageFile(file.storagePath)));

  revalidateDesignJournalPaths();
  return {};
}

export async function deleteDesignJournalFile(fileId: string, journalId: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  const existing = await getDesignJournal(journalId);
  if (!existing || !canEditDesignJournal(profile, existing)) {
    return { error: "권한이 없습니다." };
  }

  const files = await listDesignJournalFiles(journalId);
  const file = files.find((item) => item.id === fileId);
  if (!file) {
    return { error: "파일을 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("design_journal_files").delete().eq("id", fileId);
  if (error) {
    return { error: "삭제 중 오류가 발생했습니다." };
  }

  await removeDesignJournalStorageFile(file.storagePath);

  revalidateDesignJournalPaths(journalId);
  return {};
}

export async function getDesignJournalFileDownloadUrl(path: string): Promise<string | null> {
  await requireUser();
  return getDesignJournalFileSignedUrl(path);
}
