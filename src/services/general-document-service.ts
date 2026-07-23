import { createClient } from "@/lib/supabase/server";
import type { DocumentCategory } from "@/types/database.types";

export interface GeneralDocument {
  id: string;
  category: DocumentCategory;
  title: string;
  description: string | null;
  fileName: string;
  fileType: string;
  storagePath: string;
  fileSize: number;
  externalUrl: string | null;
  uploadedById: string | null;
  uploadedByName: string | null;
  uploadedAt: string;
}

const DOCUMENT_COLUMNS =
  "id, category, title, description, file_name, file_type, storage_path, file_size, external_url, uploaded_by, uploaded_at";

type DocumentRow = {
  id: string;
  category: DocumentCategory;
  title: string;
  description: string | null;
  file_name: string;
  file_type: string;
  storage_path: string;
  file_size: number;
  external_url: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
};

async function mapDocumentRows(supabase: Awaited<ReturnType<typeof createClient>>, rows: DocumentRow[]): Promise<GeneralDocument[]> {
  if (rows.length === 0) return [];

  const uploaderIds = Array.from(new Set(rows.map((row) => row.uploaded_by).filter((id): id is string => Boolean(id))));
  const { data: profiles } =
    uploaderIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", uploaderIds)
      : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((profiles ?? []).map((row) => [row.id, row.full_name]));

  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description,
    fileName: row.file_name,
    fileType: row.file_type,
    storagePath: row.storage_path,
    fileSize: row.file_size,
    externalUrl: row.external_url,
    uploadedById: row.uploaded_by,
    uploadedByName: row.uploaded_by ? (nameById.get(row.uploaded_by) ?? null) : null,
    uploadedAt: row.uploaded_at,
  }));
}

export async function listGeneralDocuments(category?: DocumentCategory): Promise<GeneralDocument[]> {
  const supabase = await createClient();
  let query = supabase.from("general_documents").select(DOCUMENT_COLUMNS).order("uploaded_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data } = await query;
  return mapDocumentRows(supabase, (data ?? []) as DocumentRow[]);
}

export async function getGeneralDocument(id: string): Promise<GeneralDocument | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("general_documents").select(DOCUMENT_COLUMNS).eq("id", id).single();
  if (!row) return null;

  const mapped = await mapDocumentRows(supabase, [row as DocumentRow]);
  return mapped[0] ?? null;
}
