import { createClient } from "@/lib/supabase/server";

export interface DataEntry {
  id: string;
  category: string;
  title: string;
  description: string | null;
  relatedVehicleId: string | null;
  relatedVehicleName: string | null;
  fileCount: number;
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

const ENTRY_COLUMNS = "id, category, title, description, related_vehicle_id, created_by, created_at, updated_at";

type EntryRow = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  related_vehicle_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

async function mapEntryRows(supabase: Awaited<ReturnType<typeof createClient>>, rows: EntryRow[]): Promise<DataEntry[]> {
  if (rows.length === 0) return [];

  const vehicleIds = Array.from(new Set(rows.map((row) => row.related_vehicle_id).filter((id): id is string => Boolean(id))));
  const creatorIds = Array.from(new Set(rows.map((row) => row.created_by).filter((id): id is string => Boolean(id))));
  const entryIds = rows.map((row) => row.id);

  const [{ data: vehicles }, { data: profiles }, { data: fileRows }] = await Promise.all([
    vehicleIds.length > 0
      ? supabase.from("vehicles").select("id, vehicle_name").in("id", vehicleIds)
      : Promise.resolve({ data: [] as { id: string; vehicle_name: string }[] }),
    creatorIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", creatorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    supabase.from("data_entry_files").select("id, data_entry_id").in("data_entry_id", entryIds),
  ]);

  const vehicleNameById = new Map((vehicles ?? []).map((row) => [row.id, row.vehicle_name]));
  const creatorNameById = new Map((profiles ?? []).map((row) => [row.id, row.full_name]));
  const fileCountByEntryId = new Map<string, number>();
  for (const row of fileRows ?? []) {
    fileCountByEntryId.set(row.data_entry_id, (fileCountByEntryId.get(row.data_entry_id) ?? 0) + 1);
  }

  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description,
    relatedVehicleId: row.related_vehicle_id,
    relatedVehicleName: row.related_vehicle_id ? (vehicleNameById.get(row.related_vehicle_id) ?? null) : null,
    fileCount: fileCountByEntryId.get(row.id) ?? 0,
    createdById: row.created_by,
    createdByName: row.created_by ? (creatorNameById.get(row.created_by) ?? null) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export interface ListDataEntriesParams {
  search?: string;
  category?: string;
}

export async function listDataEntries(params: ListDataEntriesParams = {}): Promise<DataEntry[]> {
  const supabase = await createClient();
  let query = supabase.from("data_entries").select(ENTRY_COLUMNS).order("created_at", { ascending: false });

  if (params.search) {
    const term = params.search.replace(/[%,]/g, "");
    query = query.ilike("title", `%${term}%`);
  }
  if (params.category) {
    query = query.eq("category", params.category);
  }

  const { data } = await query;
  return mapEntryRows(supabase, (data ?? []) as EntryRow[]);
}

export async function getDataEntry(id: string): Promise<DataEntry | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("data_entries").select(ENTRY_COLUMNS).eq("id", id).single();
  if (!row) return null;

  const mapped = await mapEntryRows(supabase, [row as EntryRow]);
  return mapped[0] ?? null;
}

export interface DataEntryFile {
  id: string;
  dataEntryId: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  fileSize: number;
  uploadedById: string | null;
  uploadedByName: string | null;
  createdAt: string;
}

export async function listDataEntryFiles(dataEntryId: string): Promise<DataEntryFile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("data_entry_files")
    .select("id, data_entry_id, file_name, file_type, storage_path, file_size, uploaded_by, created_at")
    .eq("data_entry_id", dataEntryId)
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
    dataEntryId: row.data_entry_id,
    fileName: row.file_name,
    fileType: row.file_type,
    storagePath: row.storage_path,
    fileSize: row.file_size,
    uploadedById: row.uploaded_by,
    uploadedByName: row.uploaded_by ? (nameById.get(row.uploaded_by) ?? null) : null,
    createdAt: row.created_at,
  }));
}

export async function listDataCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("data_entries").select("category");

  const categories = new Set((data ?? []).map((row) => row.category).filter((category): category is string => Boolean(category)));
  return Array.from(categories).sort();
}
