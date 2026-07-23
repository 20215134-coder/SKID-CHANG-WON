import { createClient } from "@/lib/supabase/server";

export interface PartFile {
  id: string;
  partId: string;
  lineageId: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  fileSize: number;
  version: number;
  isCurrent: boolean;
  uploadedById: string | null;
  uploadedByName: string | null;
  uploadedAt: string;
}

const PART_FILE_COLUMNS =
  "id, part_id, lineage_id, file_name, file_type, storage_path, file_size, version, is_current, uploaded_by, uploaded_at";

type PartFileRow = {
  id: string;
  part_id: string;
  lineage_id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  file_size: number;
  version: number;
  is_current: boolean;
  uploaded_by: string | null;
  uploaded_at: string;
};

async function attachUploaderNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  uploaderIds: string[],
): Promise<Map<string, string | null>> {
  const uniqueIds = Array.from(new Set(uploaderIds.filter((id): id is string => Boolean(id))));
  if (uniqueIds.length === 0) return new Map();

  const { data } = await supabase.from("profiles").select("id, full_name").in("id", uniqueIds);
  return new Map((data ?? []).map((row) => [row.id, row.full_name]));
}

function mapPartFileRow(row: PartFileRow, uploaderNames: Map<string, string | null>): PartFile {
  return {
    id: row.id,
    partId: row.part_id,
    lineageId: row.lineage_id,
    fileName: row.file_name,
    fileType: row.file_type,
    storagePath: row.storage_path,
    fileSize: row.file_size,
    version: row.version,
    isCurrent: row.is_current,
    uploadedById: row.uploaded_by,
    uploadedByName: row.uploaded_by ? (uploaderNames.get(row.uploaded_by) ?? null) : null,
    uploadedAt: row.uploaded_at,
  };
}

export async function listCurrentPartFiles(partId: string): Promise<PartFile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("part_files")
    .select(PART_FILE_COLUMNS)
    .eq("part_id", partId)
    .eq("is_current", true)
    .order("file_name", { ascending: true });

  const rows = data ?? [];
  const uploaderNames = await attachUploaderNames(
    supabase,
    rows.map((row) => row.uploaded_by).filter((id): id is string => Boolean(id)),
  );

  return rows.map((row) => mapPartFileRow(row, uploaderNames));
}

export async function listPartFileHistory(lineageId: string): Promise<PartFile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("part_files")
    .select(PART_FILE_COLUMNS)
    .eq("lineage_id", lineageId)
    .order("version", { ascending: false });

  const rows = data ?? [];
  const uploaderNames = await attachUploaderNames(
    supabase,
    rows.map((row) => row.uploaded_by).filter((id): id is string => Boolean(id)),
  );

  return rows.map((row) => mapPartFileRow(row, uploaderNames));
}

export async function getPartFile(id: string): Promise<PartFile | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("part_files").select(PART_FILE_COLUMNS).eq("id", id).single();
  if (!row) return null;

  const uploaderNames = await attachUploaderNames(supabase, row.uploaded_by ? [row.uploaded_by] : []);
  return mapPartFileRow(row, uploaderNames);
}

export async function listPartFilesForPaths(partId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("part_files").select("storage_path").eq("part_id", partId);
  return (data ?? []).map((row) => row.storage_path);
}
