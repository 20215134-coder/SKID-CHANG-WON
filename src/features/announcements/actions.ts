"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { canManageAnnouncements } from "@/lib/announcements/permissions";
import { createClient } from "@/lib/supabase/server";

import { createAnnouncementSchema, updateAnnouncementSchema } from "./schemas";

export interface AnnouncementActionState {
  error?: string;
  success?: boolean;
}

function revalidateAnnouncementPaths() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/announcements", "layout");
}

export async function createAnnouncement(
  _prevState: AnnouncementActionState,
  formData: FormData,
): Promise<AnnouncementActionState> {
  const profile = await requireUser();

  if (!canManageAnnouncements(profile)) {
    return { error: "공지를 등록할 권한이 없습니다." };
  }

  const parsed = createAnnouncementSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({
    title: parsed.data.title,
    content: parsed.data.content,
    created_by: profile.id,
  });

  if (error) {
    return { error: "공지 등록 중 오류가 발생했습니다." };
  }

  revalidateAnnouncementPaths();
  return { success: true };
}

export async function updateAnnouncement(
  _prevState: AnnouncementActionState,
  formData: FormData,
): Promise<AnnouncementActionState> {
  const profile = await requireUser();

  if (!canManageAnnouncements(profile)) {
    return { error: "공지를 수정할 권한이 없습니다." };
  }

  const parsed = updateAnnouncementSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({ title: parsed.data.title, content: parsed.data.content })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: "수정 중 오류가 발생했습니다." };
  }

  revalidateAnnouncementPaths();
  return { success: true };
}

export async function deleteAnnouncement(id: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  if (!canManageAnnouncements(profile)) {
    return { error: "삭제 권한이 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) {
    return { error: "삭제 중 오류가 발생했습니다." };
  }

  revalidateAnnouncementPaths();
  return {};
}
