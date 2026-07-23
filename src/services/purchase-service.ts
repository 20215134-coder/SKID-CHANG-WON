import { createClient } from "@/lib/supabase/server";
import type { BomCategory, PurchasePriority, PurchaseStatus, PurchaseTimelineEvent } from "@/types/database.types";

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  title: string;
  description: string | null;
  vehicleId: string;
  vehicleName: string;
  categoryId: string;
  categoryName: BomCategory;
  subsystemId: string | null;
  subsystemName: string | null;
  assemblyId: string | null;
  assemblyName: string | null;
  partId: string | null;
  partName: string | null;
  supplier: string | null;
  productUrl: string | null;
  quantity: number;
  estimatedCost: number;
  finalCost: number | null;
  priority: PurchasePriority;
  status: PurchaseStatus;
  requestedById: string;
  requestedByName: string | null;
  approvedById: string | null;
  approvedByName: string | null;
  purchasedById: string | null;
  purchasedByName: string | null;
  receiptFile: string | null;
  purchaseNotes: string | null;
  requestedAt: string;
  approvedAt: string | null;
  purchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const REQUEST_COLUMNS =
  "id, request_number, title, description, vehicle_id, category_id, subsystem_id, assembly_id, part_id, supplier, product_url, quantity, estimated_cost, final_cost, priority, status, requested_by, approved_by, purchased_by, receipt_file, purchase_notes, requested_at, approved_at, purchased_at, created_at, updated_at";

type RequestRow = {
  id: string;
  request_number: string;
  title: string;
  description: string | null;
  vehicle_id: string;
  category_id: string;
  subsystem_id: string | null;
  assembly_id: string | null;
  part_id: string | null;
  supplier: string | null;
  product_url: string | null;
  quantity: number;
  estimated_cost: number;
  final_cost: number | null;
  priority: PurchasePriority;
  status: PurchaseStatus;
  requested_by: string;
  approved_by: string | null;
  purchased_by: string | null;
  receipt_file: string | null;
  purchase_notes: string | null;
  requested_at: string;
  approved_at: string | null;
  purchased_at: string | null;
  created_at: string;
  updated_at: string;
};

async function mapRequestRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: RequestRow[],
): Promise<PurchaseRequest[]> {
  if (rows.length === 0) return [];

  const vehicleIds = Array.from(new Set(rows.map((row) => row.vehicle_id)));
  const categoryIds = Array.from(new Set(rows.map((row) => row.category_id)));
  const subsystemIds = Array.from(new Set(rows.map((row) => row.subsystem_id).filter((id): id is string => Boolean(id))));
  const assemblyIds = Array.from(new Set(rows.map((row) => row.assembly_id).filter((id): id is string => Boolean(id))));
  const partIds = Array.from(new Set(rows.map((row) => row.part_id).filter((id): id is string => Boolean(id))));
  const profileIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.requested_by, row.approved_by, row.purchased_by])
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const [{ data: vehicles }, { data: categories }, { data: subsystems }, { data: assemblies }, { data: parts }, { data: profiles }] =
    await Promise.all([
      supabase.from("vehicles").select("id, vehicle_name").in("id", vehicleIds),
      supabase.from("engineering_categories").select("id, name").in("id", categoryIds),
      subsystemIds.length > 0
        ? supabase.from("subsystems").select("id, name").in("id", subsystemIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      assemblyIds.length > 0
        ? supabase.from("assemblies").select("id, name").in("id", assemblyIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      partIds.length > 0
        ? supabase.from("bom_parts").select("id, part_name").in("id", partIds)
        : Promise.resolve({ data: [] as { id: string; part_name: string }[] }),
      profileIds.length > 0
        ? supabase.from("profiles").select("id, full_name").in("id", profileIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    ]);

  const vehicleById = new Map((vehicles ?? []).map((row) => [row.id, row.vehicle_name]));
  const categoryById = new Map((categories ?? []).map((row) => [row.id, row.name]));
  const subsystemById = new Map((subsystems ?? []).map((row) => [row.id, row.name]));
  const assemblyById = new Map((assemblies ?? []).map((row) => [row.id, row.name]));
  const partById = new Map((parts ?? []).map((row) => [row.id, row.part_name]));
  const profileById = new Map((profiles ?? []).map((row) => [row.id, row.full_name]));

  return rows.map((row) => ({
    id: row.id,
    requestNumber: row.request_number,
    title: row.title,
    description: row.description,
    vehicleId: row.vehicle_id,
    vehicleName: vehicleById.get(row.vehicle_id) ?? "",
    categoryId: row.category_id,
    categoryName: (categoryById.get(row.category_id) ?? "chassis") as BomCategory,
    subsystemId: row.subsystem_id,
    subsystemName: row.subsystem_id ? (subsystemById.get(row.subsystem_id) ?? null) : null,
    assemblyId: row.assembly_id,
    assemblyName: row.assembly_id ? (assemblyById.get(row.assembly_id) ?? null) : null,
    partId: row.part_id,
    partName: row.part_id ? (partById.get(row.part_id) ?? null) : null,
    supplier: row.supplier,
    productUrl: row.product_url,
    quantity: row.quantity,
    estimatedCost: row.estimated_cost,
    finalCost: row.final_cost,
    priority: row.priority,
    status: row.status,
    requestedById: row.requested_by,
    requestedByName: profileById.get(row.requested_by) ?? null,
    approvedById: row.approved_by,
    approvedByName: row.approved_by ? (profileById.get(row.approved_by) ?? null) : null,
    purchasedById: row.purchased_by,
    purchasedByName: row.purchased_by ? (profileById.get(row.purchased_by) ?? null) : null,
    receiptFile: row.receipt_file,
    purchaseNotes: row.purchase_notes,
    requestedAt: row.requested_at,
    approvedAt: row.approved_at,
    purchasedAt: row.purchased_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export type PurchaseSortField = "requested_at" | "estimated_cost" | "final_cost" | "status";

export interface ListPurchaseRequestsParams {
  search?: string;
  status?: PurchaseStatus;
  statuses?: PurchaseStatus[];
  priority?: PurchasePriority;
  vehicleId?: string;
  categoryId?: string;
  sortField?: PurchaseSortField;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ListPurchaseRequestsResult {
  requests: PurchaseRequest[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 10;

export async function listPurchaseRequests(params: ListPurchaseRequestsParams): Promise<ListPurchaseRequestsResult> {
  const supabase = await createClient();
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("purchase_requests").select(REQUEST_COLUMNS, { count: "exact" });

  if (params.search) {
    const term = params.search.replace(/[%,]/g, "");
    query = query.or(`request_number.ilike.%${term}%,title.ilike.%${term}%`);
  }
  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.statuses && params.statuses.length > 0) {
    query = query.in("status", params.statuses);
  }
  if (params.priority) {
    query = query.eq("priority", params.priority);
  }
  if (params.vehicleId) {
    query = query.eq("vehicle_id", params.vehicleId);
  }
  if (params.categoryId) {
    query = query.eq("category_id", params.categoryId);
  }

  const sortField = params.sortField ?? "requested_at";
  const sortDirection = params.sortDirection ?? "desc";
  query = query.order(sortField, { ascending: sortDirection === "asc" });

  const { data, count } = await query.range(from, to);
  const rows = (data ?? []) as RequestRow[];

  return {
    requests: await mapRequestRows(supabase, rows),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getPurchaseRequest(id: string): Promise<PurchaseRequest | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("purchase_requests").select(REQUEST_COLUMNS).eq("id", id).single();

  if (!row) return null;

  const mapped = await mapRequestRows(supabase, [row as RequestRow]);
  return mapped[0] ?? null;
}

export interface PurchaseTimelineEntry {
  id: string;
  eventType: PurchaseTimelineEvent;
  note: string | null;
  actorName: string | null;
  createdAt: string;
}

export async function listPurchaseTimeline(purchaseRequestId: string): Promise<PurchaseTimelineEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_timeline")
    .select("id, event_type, note, actor_id, created_at")
    .eq("purchase_request_id", purchaseRequestId)
    .order("created_at", { ascending: true });

  const rows = data ?? [];
  const actorIds = Array.from(new Set(rows.map((row) => row.actor_id).filter((id): id is string => Boolean(id))));

  const { data: profiles } =
    actorIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", actorIds)
      : { data: [] as { id: string; full_name: string | null }[] };

  const nameById = new Map((profiles ?? []).map((row) => [row.id, row.full_name]));

  return rows.map((row) => ({
    id: row.id,
    eventType: row.event_type,
    note: row.note,
    actorName: row.actor_id ? (nameById.get(row.actor_id) ?? null) : null,
    createdAt: row.created_at,
  }));
}

export interface PurchaseRequestFile {
  id: string;
  purchaseRequestId: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  fileSize: number;
  uploadedByName: string | null;
  uploadedAt: string;
}

export async function listPurchaseRequestFiles(purchaseRequestId: string): Promise<PurchaseRequestFile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_request_files")
    .select("id, purchase_request_id, file_name, file_type, storage_path, file_size, uploaded_by, uploaded_at")
    .eq("purchase_request_id", purchaseRequestId)
    .order("uploaded_at", { ascending: true });

  const rows = data ?? [];
  const uploaderIds = Array.from(new Set(rows.map((row) => row.uploaded_by).filter((id): id is string => Boolean(id))));

  const { data: profiles } =
    uploaderIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", uploaderIds)
      : { data: [] as { id: string; full_name: string | null }[] };

  const nameById = new Map((profiles ?? []).map((row) => [row.id, row.full_name]));

  return rows.map((row) => ({
    id: row.id,
    purchaseRequestId: row.purchase_request_id,
    fileName: row.file_name,
    fileType: row.file_type,
    storagePath: row.storage_path,
    fileSize: row.file_size,
    uploadedByName: row.uploaded_by ? (nameById.get(row.uploaded_by) ?? null) : null,
    uploadedAt: row.uploaded_at,
  }));
}
