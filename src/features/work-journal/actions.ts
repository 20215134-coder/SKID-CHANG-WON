"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { canDeleteWorkJournal, canEditWorkJournal } from "@/lib/work-journal/permissions";
import { extractFileExtension, isAllowedWorkJournalFile } from "@/lib/work-journal/constants";
import { sanitizeJournalHtml } from "@/lib/editor/sanitize";
import { createClient } from "@/lib/supabase/server";
import {
  deleteWorkJournalFile as removeWorkJournalStorageFile,
  getWorkJournalFileSignedUrl,
  uploadWorkJournalFile as uploadWorkJournalStorageFile,
} from "@/lib/supabase/storage";
import { listInventoryItemOptions } from "@/services/inventory-service";
import { listActiveMemberOptions } from "@/services/team-service";
import { getWorkJournal, listWorkJournalFiles } from "@/services/work-journal-service";

import { updateWorkJournalFormSchema, workJournalFormSchema } from "./schemas";

export interface WorkJournalActionState {
  error?: string;
  success?: boolean;
  id?: string;
}

function revalidateWorkJournalPaths(id?: string) {
  revalidatePath("/dashboard/work-journal", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory", "layout");
  if (id) revalidatePath(`/dashboard/work-journal/${id}`);
}

function collectAttachments(formData: FormData): File[] {
  return formData.getAll("attachments").filter((value): value is File => value instanceof File && value.size > 0);
}

async function uploadJournalFiles(journalId: string, files: File[], uploadedBy: string) {
  const supabase = await createClient();

  for (const file of files) {
    if (!isAllowedWorkJournalFile(file.name)) continue;

    let storagePath: string;
    try {
      storagePath = await uploadWorkJournalStorageFile(file);
    } catch {
      continue;
    }

    const { error } = await supabase.from("work_journal_files").insert({
      journal_id: journalId,
      file_name: file.name,
      file_type: extractFileExtension(file.name),
      storage_path: storagePath,
      file_size: file.size,
      uploaded_by: uploadedBy,
    });

    if (error) {
      await removeWorkJournalStorageFile(storagePath);
    }
  }
}

async function replaceParticipants(journalId: string, memberIds: string[]) {
  const supabase = await createClient();
  await supabase.from("work_journal_participants").delete().eq("journal_id", journalId);

  if (memberIds.length === 0) return;

  await supabase
    .from("work_journal_participants")
    .insert(memberIds.map((memberId) => ({ journal_id: journalId, member_id: memberId })));
}

export async function createWorkJournal(
  _prevState: WorkJournalActionState,
  formData: FormData,
): Promise<WorkJournalActionState> {
  const profile = await requireUser();

  const parsed = workJournalFormSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    vehicleId: formData.get("vehicleId"),
    engineeringCategory: formData.get("engineeringCategory"),
    subsystemId: formData.get("subsystemId") || undefined,
    assemblyId: formData.get("assemblyId") || undefined,
    workStart: formData.get("workStart"),
    workEnd: formData.get("workEnd"),
    participantIds: formData.get("participantIds") || undefined,
    consumables: formData.get("consumables") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("work_journals")
    .insert({
      title: parsed.data.title,
      content: sanitizeJournalHtml(parsed.data.content),
      author_id: profile.id,
      vehicle_id: parsed.data.vehicleId,
      engineering_category: parsed.data.engineeringCategory,
      subsystem_id: parsed.data.subsystemId ?? null,
      assembly_id: parsed.data.assemblyId ?? null,
      work_start: new Date(parsed.data.workStart).toISOString(),
      work_end: new Date(parsed.data.workEnd).toISOString(),
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: "작업일지 작성 중 오류가 발생했습니다." };
  }

  await replaceParticipants(inserted.id, parsed.data.participantIds);

  if (parsed.data.consumables.length > 0) {
    const { error: rpcError } = await supabase.rpc("record_work_journal_consumables", {
      p_journal_id: inserted.id,
      p_items: parsed.data.consumables.map((item) => ({ item_id: item.itemId, quantity: item.quantity })),
    });

    if (rpcError) {
      return { error: rpcError.message };
    }
  }

  await uploadJournalFiles(inserted.id, collectAttachments(formData), profile.id);

  revalidateWorkJournalPaths(inserted.id);
  return { success: true, id: inserted.id };
}

export async function updateWorkJournal(
  _prevState: WorkJournalActionState,
  formData: FormData,
): Promise<WorkJournalActionState> {
  const profile = await requireUser();

  const parsed = updateWorkJournalFormSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    content: formData.get("content"),
    vehicleId: formData.get("vehicleId"),
    engineeringCategory: formData.get("engineeringCategory"),
    subsystemId: formData.get("subsystemId") || undefined,
    assemblyId: formData.get("assemblyId") || undefined,
    workStart: formData.get("workStart"),
    workEnd: formData.get("workEnd"),
    participantIds: formData.get("participantIds") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const existing = await getWorkJournal(parsed.data.id);
  if (!existing) {
    return { error: "작업일지를 찾을 수 없습니다." };
  }

  if (!canEditWorkJournal(profile, existing)) {
    return { error: "이 작업일지를 수정할 권한이 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("work_journals")
    .update({
      title: parsed.data.title,
      content: sanitizeJournalHtml(parsed.data.content),
      vehicle_id: parsed.data.vehicleId,
      engineering_category: parsed.data.engineeringCategory,
      subsystem_id: parsed.data.subsystemId ?? null,
      assembly_id: parsed.data.assemblyId ?? null,
      work_start: new Date(parsed.data.workStart).toISOString(),
      work_end: new Date(parsed.data.workEnd).toISOString(),
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: "작업일지 수정 중 오류가 발생했습니다." };
  }

  await replaceParticipants(parsed.data.id, parsed.data.participantIds);
  await uploadJournalFiles(parsed.data.id, collectAttachments(formData), profile.id);

  revalidateWorkJournalPaths(parsed.data.id);
  return { success: true, id: parsed.data.id };
}

export async function deleteWorkJournal(id: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  const existing = await getWorkJournal(id);
  if (!existing) {
    return { error: "작업일지를 찾을 수 없습니다." };
  }

  if (!canDeleteWorkJournal(profile, existing)) {
    return { error: "이 작업일지를 삭제할 권한이 없습니다." };
  }

  const files = await listWorkJournalFiles(id);

  const supabase = await createClient();
  const { error } = await supabase.from("work_journals").delete().eq("id", id);

  if (error) {
    return { error: "삭제 중 오류가 발생했습니다." };
  }

  await Promise.all(files.map((file) => removeWorkJournalStorageFile(file.storagePath)));

  revalidateWorkJournalPaths();
  return {};
}

export async function deleteWorkJournalFile(fileId: string, journalId: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  const existing = await getWorkJournal(journalId);
  if (!existing || !canEditWorkJournal(profile, existing)) {
    return { error: "권한이 없습니다." };
  }

  const files = await listWorkJournalFiles(journalId);
  const file = files.find((item) => item.id === fileId);
  if (!file) {
    return { error: "파일을 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("work_journal_files").delete().eq("id", fileId);
  if (error) {
    return { error: "삭제 중 오류가 발생했습니다." };
  }

  await removeWorkJournalStorageFile(file.storagePath);

  revalidateWorkJournalPaths(journalId);
  return {};
}

export async function getWorkJournalFileDownloadUrl(path: string): Promise<string | null> {
  await requireUser();
  return getWorkJournalFileSignedUrl(path);
}

export async function fetchActiveMembers() {
  await requireUser();
  return listActiveMemberOptions();
}

export async function fetchConsumableItemOptions() {
  await requireUser();
  return listInventoryItemOptions();
}
