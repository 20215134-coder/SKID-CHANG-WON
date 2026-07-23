import { createClient } from "@/lib/supabase/server";

export interface AssemblyFile {
  id: string;
  assemblyId: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  fileSize: number;
  externalUrl: string | null;
  uploadedById: string | null;
  uploadedByName: string | null;
  uploadedAt: string;
}

const ASSEMBLY_FILE_COLUMNS =
  "id, assembly_id, file_name, file_type, storage_path, file_size, external_url, uploaded_by, uploaded_at";

type AssemblyFileRow = {
  id: string;
  assembly_id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  file_size: number;
  external_url: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
};

function mapAssemblyFileRow(row: AssemblyFileRow, uploaderNames: Map<string, string | null>): AssemblyFile {
  return {
    id: row.id,
    assemblyId: row.assembly_id,
    fileName: row.file_name,
    fileType: row.file_type,
    storagePath: row.storage_path,
    fileSize: row.file_size,
    externalUrl: row.external_url,
    uploadedById: row.uploaded_by,
    uploadedByName: row.uploaded_by ? (uploaderNames.get(row.uploaded_by) ?? null) : null,
    uploadedAt: row.uploaded_at,
  };
}

async function attachUploaderNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  uploaderIds: (string | null)[],
): Promise<Map<string, string | null>> {
  const uniqueIds = Array.from(new Set(uploaderIds.filter((id): id is string => Boolean(id))));
  if (uniqueIds.length === 0) return new Map();

  const { data } = await supabase.from("profiles").select("id, full_name").in("id", uniqueIds);
  return new Map((data ?? []).map((row) => [row.id, row.full_name]));
}

export async function listAssemblyFiles(assemblyId: string): Promise<AssemblyFile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assembly_files")
    .select(ASSEMBLY_FILE_COLUMNS)
    .eq("assembly_id", assemblyId)
    .order("file_name", { ascending: true });

  const rows = data ?? [];
  const uploaderNames = await attachUploaderNames(
    supabase,
    rows.map((row) => row.uploaded_by),
  );

  return rows.map((row) => mapAssemblyFileRow(row, uploaderNames));
}

export async function getAssemblyFile(id: string): Promise<AssemblyFile | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("assembly_files").select(ASSEMBLY_FILE_COLUMNS).eq("id", id).single();
  if (!row) return null;

  const uploaderNames = await attachUploaderNames(supabase, [row.uploaded_by]);
  return mapAssemblyFileRow(row, uploaderNames);
}
