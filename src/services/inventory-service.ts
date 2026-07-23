import { createClient } from "@/lib/supabase/server";
import { resolveAssemblyCategoriesBatch } from "@/services/bom-service";
import type { BomCategory, InventoryCategory, InventoryItemStatus, InventoryMovementType } from "@/types/database.types";

export interface InventoryItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: InventoryCategory;
  manufacturer: string | null;
  supplier: string | null;
  description: string | null;
  currentQuantity: number;
  minimumQuantity: number;
  unit: string;
  storageLocation: string | null;
  unitCost: number | null;
  totalAssetValue: number;
  status: InventoryItemStatus;
  relatedPartId: string | null;
  relatedPartNumber: string | null;
  relatedPartName: string | null;
  relatedPartCategory: BomCategory | null;
  owningDepartment: string | null;
  createdAt: string;
  updatedAt: string;
}

const ITEM_COLUMNS =
  "id, item_code, item_name, category, manufacturer, supplier, description, current_quantity, minimum_quantity, unit, storage_location, unit_cost, total_asset_value, status, related_part_id, owning_department, created_at, updated_at";

type ItemRow = {
  id: string;
  item_code: string;
  item_name: string;
  category: InventoryCategory;
  manufacturer: string | null;
  supplier: string | null;
  description: string | null;
  current_quantity: number;
  minimum_quantity: number;
  unit: string;
  storage_location: string | null;
  unit_cost: number | null;
  total_asset_value: number;
  status: InventoryItemStatus;
  related_part_id: string | null;
  owning_department: string | null;
  created_at: string;
  updated_at: string;
};

async function mapItemRows(supabase: Awaited<ReturnType<typeof createClient>>, rows: ItemRow[]): Promise<InventoryItem[]> {
  if (rows.length === 0) return [];

  const partIds = Array.from(new Set(rows.map((row) => row.related_part_id).filter((id): id is string => Boolean(id))));

  const { data: parts } =
    partIds.length > 0
      ? await supabase.from("bom_parts").select("id, part_number, part_name, assembly_id").in("id", partIds)
      : { data: [] as { id: string; part_number: string; part_name: string; assembly_id: string }[] };

  const partById = new Map((parts ?? []).map((row) => [row.id, row]));

  const assemblyIds = Array.from(new Set((parts ?? []).map((row) => row.assembly_id)));
  const bomCategoryByAssemblyId = await resolveAssemblyCategoriesBatch(supabase, assemblyIds);

  return rows.map((row) => {
    const part = row.related_part_id ? partById.get(row.related_part_id) : undefined;

    return {
      id: row.id,
      itemCode: row.item_code,
      itemName: row.item_name,
      category: row.category,
      manufacturer: row.manufacturer,
      supplier: row.supplier,
      description: row.description,
      currentQuantity: row.current_quantity,
      minimumQuantity: row.minimum_quantity,
      unit: row.unit,
      storageLocation: row.storage_location,
      unitCost: row.unit_cost,
      totalAssetValue: row.total_asset_value,
      status: row.status,
      relatedPartId: row.related_part_id,
      relatedPartNumber: part?.part_number ?? null,
      relatedPartName: part?.part_name ?? null,
      relatedPartCategory: part ? (bomCategoryByAssemblyId.get(part.assembly_id) ?? null) : null,
      owningDepartment: row.owning_department,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

export type InventorySortField = "item_name" | "current_quantity" | "updated_at";

export interface ListInventoryItemsParams {
  search?: string;
  category?: InventoryCategory;
  status?: InventoryItemStatus;
  storageLocation?: string;
  sortField?: InventorySortField;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ListInventoryItemsResult {
  items: InventoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 10;

export async function listInventoryItems(params: ListInventoryItemsParams): Promise<ListInventoryItemsResult> {
  const supabase = await createClient();
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("inventory_items").select(ITEM_COLUMNS, { count: "exact" });

  if (params.search) {
    const term = params.search.replace(/[%,]/g, "");
    query = query.or(
      `item_code.ilike.%${term}%,item_name.ilike.%${term}%,supplier.ilike.%${term}%,manufacturer.ilike.%${term}%`,
    );
  }
  if (params.category) {
    query = query.eq("category", params.category);
  }
  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.storageLocation) {
    query = query.eq("storage_location", params.storageLocation);
  }

  const sortField = params.sortField ?? "updated_at";
  const sortDirection = params.sortDirection ?? "desc";
  query = query.order(sortField, { ascending: sortDirection === "asc" });

  const { data, count } = await query.range(from, to);
  const rows = (data ?? []) as ItemRow[];

  return {
    items: await mapItemRows(supabase, rows),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("inventory_items").select(ITEM_COLUMNS).eq("id", id).single();

  if (!row) return null;

  const mapped = await mapItemRows(supabase, [row as ItemRow]);
  return mapped[0] ?? null;
}

export async function listStorageLocations(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("inventory_items").select("storage_location").not("storage_location", "is", null);

  const locations = new Set(
    (data ?? []).map((row) => row.storage_location).filter((location): location is string => Boolean(location)),
  );

  return Array.from(locations).sort();
}

export interface InventoryItemOption {
  id: string;
  itemCode: string;
  itemName: string;
  unitCost: number | null;
  currentQuantity: number;
  unit: string;
}

export async function listInventoryItemOptions(category?: InventoryCategory): Promise<InventoryItemOption[]> {
  const supabase = await createClient();
  let query = supabase
    .from("inventory_items")
    .select("id, item_code, item_name, unit_cost, current_quantity, unit")
    .order("item_code", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data } = await query;

  return (data ?? []).map((row) => ({
    id: row.id,
    itemCode: row.item_code,
    itemName: row.item_name,
    unitCost: row.unit_cost,
    currentQuantity: row.current_quantity,
    unit: row.unit,
  }));
}

export interface InventoryMovementEntry {
  id: string;
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  movementType: InventoryMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string | null;
  performedByName: string | null;
  createdAt: string;
}

export interface ListInventoryMovementsParams {
  inventoryItemId?: string;
  movementType?: InventoryMovementType;
  page?: number;
  pageSize?: number;
}

export interface ListInventoryMovementsResult {
  entries: InventoryMovementEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listInventoryMovements(params: ListInventoryMovementsParams): Promise<ListInventoryMovementsResult> {
  const supabase = await createClient();
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("inventory_movements")
    .select("id, inventory_item_id, movement_type, quantity, previous_quantity, new_quantity, reason, performed_by, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (params.inventoryItemId) {
    query = query.eq("inventory_item_id", params.inventoryItemId);
  }
  if (params.movementType) {
    query = query.eq("movement_type", params.movementType);
  }

  const { data, count } = await query.range(from, to);
  const rows = data ?? [];

  const itemIds = Array.from(new Set(rows.map((row) => row.inventory_item_id)));
  const performerIds = Array.from(new Set(rows.map((row) => row.performed_by).filter((id): id is string => Boolean(id))));

  const [{ data: items }, { data: profiles }] = await Promise.all([
    itemIds.length > 0
      ? supabase.from("inventory_items").select("id, item_code, item_name").in("id", itemIds)
      : Promise.resolve({ data: [] as { id: string; item_code: string; item_name: string }[] }),
    performerIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", performerIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
  ]);

  const itemById = new Map((items ?? []).map((row) => [row.id, row]));
  const nameByPerformerId = new Map((profiles ?? []).map((row) => [row.id, row.full_name]));

  return {
    entries: rows.map((row) => ({
      id: row.id,
      inventoryItemId: row.inventory_item_id,
      itemCode: itemById.get(row.inventory_item_id)?.item_code ?? "",
      itemName: itemById.get(row.inventory_item_id)?.item_name ?? "",
      movementType: row.movement_type,
      quantity: row.quantity,
      previousQuantity: row.previous_quantity,
      newQuantity: row.new_quantity,
      reason: row.reason,
      performedByName: row.performed_by ? (nameByPerformerId.get(row.performed_by) ?? null) : null,
      createdAt: row.created_at,
    })),
    total: count ?? 0,
    page,
    pageSize,
  };
}
