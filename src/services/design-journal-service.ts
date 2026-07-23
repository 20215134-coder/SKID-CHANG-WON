import { createClient } from "@/lib/supabase/server";
import type { BomCategory } from "@/types/database.types";

export interface DesignJournal {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string | null;
  vehicleId: string;
  vehicleName: string;
  engineeringCategory: BomCategory;
  subsystemId: string | null;
  subsystemName: string | null;
  assemblyId: string | null;
  assemblyName: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DesignJournalFile {
  id: string;
  journalId: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  fileSize: number;
  uploadedById: string | null;
  uploadedByName: string | null;
  createdAt: string;
}

const JOURNAL_COLUMNS =
  "id, title, content, author_id, vehicle_id, engineering_category, subsystem_id, assembly_id, tags, created_at, updated_at";

type JournalRow = {
  id: string;
  title: string;
  content: string;
  author_id: string;
  vehicle_id: string;
  engineering_category: BomCategory;
  subsystem_id: string | null;
  assembly_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

async function mapJournalRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: JournalRow[],
): Promise<DesignJournal[]> {
  if (rows.length === 0) return [];

  const authorIds = Array.from(new Set(rows.map((row) => row.author_id)));
  const vehicleIds = Array.from(new Set(rows.map((row) => row.vehicle_id)));
  const subsystemIds = Array.from(new Set(rows.map((row) => row.subsystem_id).filter((id): id is string => Boolean(id))));
  const assemblyIds = Array.from(new Set(rows.map((row) => row.assembly_id).filter((id): id is string => Boolean(id))));

  const [{ data: authors }, { data: vehicles }, { data: subsystems }, { data: assemblies }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", authorIds),
    supabase.from("vehicles").select("id, vehicle_name").in("id", vehicleIds),
    subsystemIds.length > 0
      ? supabase.from("subsystems").select("id, name").in("id", subsystemIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    assemblyIds.length > 0
      ? supabase.from("assemblies").select("id, name").in("id", assemblyIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const authorNameById = new Map((authors ?? []).map((row) => [row.id, row.full_name]));
  const vehicleNameById = new Map((vehicles ?? []).map((row) => [row.id, row.vehicle_name]));
  const subsystemNameById = new Map((subsystems ?? []).map((row) => [row.id, row.name]));
  const assemblyNameById = new Map((assemblies ?? []).map((row) => [row.id, row.name]));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    authorId: row.author_id,
    authorName: authorNameById.get(row.author_id) ?? null,
    vehicleId: row.vehicle_id,
    vehicleName: vehicleNameById.get(row.vehicle_id) ?? "",
    engineeringCategory: row.engineering_category,
    subsystemId: row.subsystem_id,
    subsystemName: row.subsystem_id ? (subsystemNameById.get(row.subsystem_id) ?? null) : null,
    assemblyId: row.assembly_id,
    assemblyName: row.assembly_id ? (assemblyNameById.get(row.assembly_id) ?? null) : null,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export interface ListDesignJournalsParams {
  vehicleId?: string;
  engineeringCategory?: BomCategory;
  search?: string;
  limit?: number;
}

export async function listDesignJournals(params: ListDesignJournalsParams = {}): Promise<DesignJournal[]> {
  const supabase = await createClient();
  let query = supabase.from("design_journals").select(JOURNAL_COLUMNS).order("created_at", { ascending: false });

  if (params.vehicleId) query = query.eq("vehicle_id", params.vehicleId);
  if (params.engineeringCategory) query = query.eq("engineering_category", params.engineeringCategory);
  if (params.search) {
    const term = params.search.replace(/[%,]/g, "");
    query = query.or(`title.ilike.%${term}%,tags.cs.{${term}}`);
  }
  if (params.limit) query = query.limit(params.limit);

  const { data } = await query;
  return mapJournalRows(supabase, (data ?? []) as JournalRow[]);
}

export async function getDesignJournal(id: string): Promise<DesignJournal | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("design_journals").select(JOURNAL_COLUMNS).eq("id", id).single();
  if (!row) return null;

  const mapped = await mapJournalRows(supabase, [row as JournalRow]);
  return mapped[0] ?? null;
}

export async function listDesignJournalFiles(journalId: string): Promise<DesignJournalFile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("design_journal_files")
    .select("id, journal_id, file_name, file_type, storage_path, file_size, uploaded_by, created_at")
    .eq("journal_id", journalId)
    .order("created_at", { ascending: true });

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const uploaderIds = Array.from(new Set(rows.map((row) => row.uploaded_by).filter((id): id is string => Boolean(id))));
  const { data: profiles } =
    uploaderIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", uploaderIds)
      : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((profiles ?? []).map((row) => [row.id, row.full_name]));

  return rows.map((row) => ({
    id: row.id,
    journalId: row.journal_id,
    fileName: row.file_name,
    fileType: row.file_type,
    storagePath: row.storage_path,
    fileSize: row.file_size,
    uploadedById: row.uploaded_by,
    uploadedByName: row.uploaded_by ? (nameById.get(row.uploaded_by) ?? null) : null,
    createdAt: row.created_at,
  }));
}

export async function listRecentDesignJournals(limit: number): Promise<DesignJournal[]> {
  return listDesignJournals({ limit });
}
