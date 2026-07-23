import { createClient } from "@/lib/supabase/server";
import type { BomCategory } from "@/types/database.types";

export interface WorkJournalParticipant {
  id: string;
  memberId: string;
  memberName: string | null;
}

export interface WorkJournalConsumable {
  id: string;
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  quantityUsed: number;
}

export interface WorkJournal {
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
  workStart: string;
  workEnd: string;
  totalWorkTime: string;
  createdAt: string;
  updatedAt: string;
}

const JOURNAL_COLUMNS =
  "id, title, content, author_id, vehicle_id, engineering_category, subsystem_id, assembly_id, work_start, work_end, total_work_time, created_at, updated_at";

type JournalRow = {
  id: string;
  title: string;
  content: string;
  author_id: string;
  vehicle_id: string;
  engineering_category: BomCategory;
  subsystem_id: string | null;
  assembly_id: string | null;
  work_start: string;
  work_end: string;
  total_work_time: string;
  created_at: string;
  updated_at: string;
};

async function mapJournalRows(supabase: Awaited<ReturnType<typeof createClient>>, rows: JournalRow[]): Promise<WorkJournal[]> {
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
    workStart: row.work_start,
    workEnd: row.work_end,
    totalWorkTime: row.total_work_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export interface ListWorkJournalsParams {
  vehicleId?: string;
  engineeringCategory?: BomCategory;
  search?: string;
  limit?: number;
}

export async function listWorkJournals(params: ListWorkJournalsParams = {}): Promise<WorkJournal[]> {
  const supabase = await createClient();
  let query = supabase.from("work_journals").select(JOURNAL_COLUMNS).order("created_at", { ascending: false });

  if (params.vehicleId) query = query.eq("vehicle_id", params.vehicleId);
  if (params.engineeringCategory) query = query.eq("engineering_category", params.engineeringCategory);
  if (params.search) {
    const term = params.search.replace(/[%,]/g, "");
    query = query.ilike("title", `%${term}%`);
  }
  if (params.limit) query = query.limit(params.limit);

  const { data } = await query;
  return mapJournalRows(supabase, (data ?? []) as JournalRow[]);
}

export async function getWorkJournal(id: string): Promise<WorkJournal | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("work_journals").select(JOURNAL_COLUMNS).eq("id", id).single();
  if (!row) return null;

  const mapped = await mapJournalRows(supabase, [row as JournalRow]);
  return mapped[0] ?? null;
}

export async function listWorkJournalParticipants(journalId: string): Promise<WorkJournalParticipant[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("work_journal_participants")
    .select("id, member_id")
    .eq("journal_id", journalId);

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const memberIds = Array.from(new Set(rows.map((row) => row.member_id)));
  const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", memberIds);
  const nameById = new Map((profiles ?? []).map((row) => [row.id, row.full_name]));

  return rows.map((row) => ({
    id: row.id,
    memberId: row.member_id,
    memberName: nameById.get(row.member_id) ?? null,
  }));
}

export async function listWorkJournalConsumables(journalId: string): Promise<WorkJournalConsumable[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("work_journal_consumables")
    .select("id, inventory_item_id, quantity_used")
    .eq("journal_id", journalId);

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const itemIds = Array.from(new Set(rows.map((row) => row.inventory_item_id)));
  const { data: items } = await supabase.from("inventory_items").select("id, item_code, item_name, unit").in("id", itemIds);
  const itemById = new Map((items ?? []).map((row) => [row.id, row]));

  return rows.map((row) => {
    const item = itemById.get(row.inventory_item_id);
    return {
      id: row.id,
      inventoryItemId: row.inventory_item_id,
      itemCode: item?.item_code ?? "",
      itemName: item?.item_name ?? "",
      unit: item?.unit ?? "",
      quantityUsed: row.quantity_used,
    };
  });
}

export interface WorkJournalFile {
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

export async function listWorkJournalFiles(journalId: string): Promise<WorkJournalFile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("work_journal_files")
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

export async function listRecentWorkJournals(limit: number): Promise<WorkJournal[]> {
  return listWorkJournals({ limit });
}
