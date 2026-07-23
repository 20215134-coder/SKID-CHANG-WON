"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { canManageBomCategory } from "@/lib/bom/permissions";
import { createClient } from "@/lib/supabase/server";
import { deleteBomFile, uploadBomFile } from "@/lib/supabase/storage";
import { extractFileExtension, isAllowedPartFile } from "@/lib/part-files/constants";
import { resolveAssemblyCategory } from "@/lib/vehicle/resolve-category";
import { getAssemblyFile } from "@/services/assembly-file-service";
import type { AuthProfile } from "@/types/auth";

export interface AssemblyFileActionState {
  error?: string;
  success?: boolean;
}

function revalidateVehiclePaths() {
  revalidatePath("/dashboard/vehicle", "layout");
  revalidatePath("/dashboard/files", "layout");
}

async function assertCanManageAssembly(profile: AuthProfile, assemblyId: string): Promise<string | null> {
  const category = await resolveAssemblyCategory(assemblyId);
  if (!category || !canManageBomCategory(profile, category)) {
    return "담당 카테고리의 조립품에만 파일을 업로드할 수 있습니다.";
  }
  return null;
}

export async function uploadAssemblyFiles(
  _prevState: AssemblyFileActionState,
  formData: FormData,
): Promise<AssemblyFileActionState> {
  const profile = await requireUser();
  const assemblyId = formData.get("assemblyId");

  if (typeof assemblyId !== "string" || !assemblyId) {
    return { error: "잘못된 요청입니다." };
  }
  if (profile.role === "member") {
    return { error: "파일을 업로드할 권한이 없습니다." };
  }

  const permissionError = await assertCanManageAssembly(profile, assemblyId);
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

    const { error } = await supabase.from("assembly_files").insert({
      assembly_id: assemblyId,
      file_name: file.name,
      file_type: extractFileExtension(file.name),
      storage_path: storagePath,
      file_size: file.size,
      uploaded_by: profile.id,
    });

    if (error) {
      await deleteBomFile(storagePath);
      return { error: "파일 업로드 중 오류가 발생했습니다." };
    }
  }

  revalidateVehiclePaths();
  return { success: true };
}

export async function deleteAssemblyFile(id: string): Promise<{ error?: string }> {
  const profile = await requireUser();

  const existing = await getAssemblyFile(id);
  if (!existing) {
    return { error: "파일을 찾을 수 없습니다." };
  }

  const permissionError = await assertCanManageAssembly(profile, existing.assemblyId);
  if (permissionError) return { error: permissionError };

  const supabase = await createClient();
  const { error } = await supabase.from("assembly_files").delete().eq("id", id);

  if (error) {
    return { error: "삭제 중 오류가 발생했습니다." };
  }

  await deleteBomFile(existing.storagePath);

  revalidateVehiclePaths();
  return {};
}
