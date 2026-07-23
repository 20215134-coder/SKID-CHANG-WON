"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { canManageBomCategory } from "@/lib/bom/permissions";
import { createClient } from "@/lib/supabase/server";
import { deleteBomFile, uploadBomFile } from "@/lib/supabase/storage";
import { extractFileExtension, isAllowedPartFile } from "@/lib/part-files/constants";
import { resolveAssemblyCategory } from "@/lib/vehicle/resolve-category";
import { getPart } from "@/services/bom-service";
import { getPartFile, listPartFileHistory, type PartFile } from "@/services/part-file-service";
import type { AuthProfile } from "@/types/auth";

export interface PartFileActionState {
  error?: string;
  success?: boolean;
}

function revalidateVehiclePaths() {
  revalidatePath("/dashboard/vehicle", "layout");
}

async function assertCanManagePart(profile: AuthProfile, partId: string): Promise<string | null> {
  const part = await getPart(partId);
  if (!part) return "부품을 찾을 수 없습니다.";

  const category = await resolveAssemblyCategory(part.assemblyId);
  if (!category || !canManageBomCategory(profile, category)) {
    return "담당 카테고리의 부품에만 파일을 업로드할 수 있습니다.";
  }
  return null;
}

export async function uploadPartFiles(
  _prevState: PartFileActionState,
  formData: FormData,
): Promise<PartFileActionState> {
  const profile = await requireUser();
  const partId = formData.get("partId");

  if (typeof partId !== "string" || !partId) {
    return { error: "잘못된 요청입니다." };
  }
  if (profile.role === "member") {
    return { error: "파일을 업로드할 권한이 없습니다." };
  }

  const permissionError = await assertCanManagePart(profile, partId);
  if (permissionError) return { error: permissionError };

  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) {
    return { error: "업로드할 파일을 선택해주세요." };
  }

  const invalid = files.find((file) => !isAllowedPartFile(file.name));
  if (invalid) {
    return { error: `지원하지 않는 파일 형식입니다: ${invalid.name}` };
  }

  const supabase = await createClient();

  for (const file of files) {
    let storagePath: string;
    try {
      storagePath = await uploadBomFile(file);
    } catch (error) {
      return { error: error instanceof Error ? error.message : "파일 업로드에 실패했습니다." };
    }

    const { error } = await supabase.rpc("upload_part_file", {
      p_part_id: partId,
      p_file_name: file.name,
      p_file_type: extractFileExtension(file.name),
      p_storage_path: storagePath,
      p_file_size: file.size,
    });

    if (error) {
      await deleteBomFile(storagePath);
      return { error: error.message };
    }
  }

  revalidateVehiclePaths();
  return { success: true };
}

export async function replacePartFile(
  _prevState: PartFileActionState,
  formData: FormData,
): Promise<PartFileActionState> {
  const profile = await requireUser();
  const fileId = formData.get("fileId");
  const file = formData.get("file");

  if (typeof fileId !== "string" || !fileId) {
    return { error: "잘못된 요청입니다." };
  }
  if (profile.role === "member") {
    return { error: "파일을 교체할 권한이 없습니다." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "교체할 파일을 선택해주세요." };
  }
  if (!isAllowedPartFile(file.name)) {
    return { error: "지원하지 않는 파일 형식입니다." };
  }

  const existing = await getPartFile(fileId);
  if (!existing) {
    return { error: "파일을 찾을 수 없습니다." };
  }

  const permissionError = await assertCanManagePart(profile, existing.partId);
  if (permissionError) return { error: permissionError };

  let storagePath: string;
  try {
    storagePath = await uploadBomFile(file);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "파일 업로드에 실패했습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("upload_part_file", {
    p_part_id: existing.partId,
    p_file_name: file.name,
    p_file_type: extractFileExtension(file.name),
    p_storage_path: storagePath,
    p_file_size: file.size,
    p_replaces_file_id: fileId,
  });

  if (error) {
    await deleteBomFile(storagePath);
    return { error: error.message };
  }

  revalidateVehiclePaths();
  return { success: true };
}

export async function deletePartFile(fileId: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  if (profile.role !== "admin") {
    return { error: "삭제 권한이 없습니다." };
  }

  const existing = await getPartFile(fileId);
  if (!existing) {
    return { error: "파일을 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("part_files").delete().eq("id", fileId);

  if (error) {
    return { error: "삭제 중 오류가 발생했습니다." };
  }

  await deleteBomFile(existing.storagePath);

  revalidateVehiclePaths();
  return {};
}

export async function fetchPartFileHistory(lineageId: string): Promise<PartFile[]> {
  await requireUser();
  return listPartFileHistory(lineageId);
}
