import { BOM_CATEGORIES, BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { createClient } from "@/lib/supabase/server";
import type { BomCategory, ManufacturingStatus } from "@/types/database.types";

export interface BomPart {
  id: string;
  assemblyId: string;
  partNumber: string;
  partName: string;
  revision: string;
  material: string | null;
  weight: number | null;
  manufacturingStatus: ManufacturingStatus;
  ownerId: string | null;
  ownerName: string | null;
  supplier: string | null;
  description: string | null;
  inventoryItemId: string | null;
  inventoryItemCode: string | null;
  inventoryItemName: string | null;
  assetId: string | null;
  assetNumber: string | null;
  assetName: string | null;
  materialQuantity: number;
  materialUnitCost: number | null;
  materialCost: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BomPartRevision {
  id: string;
  revision: string;
  partName: string;
  material: string | null;
  weight: number | null;
  manufacturingStatus: ManufacturingStatus;
  supplier: string | null;
  description: string | null;
  recordedAt: string;
  recordedByName: string | null;
}

export type BomSortField = "part_name" | "revision" | "updated_at";

export interface ListPartsParams {
  assemblyId: string;
  search?: string;
  status?: ManufacturingStatus;
  sortField?: BomSortField;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ListPartsResult {
  parts: BomPart[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 10;

const PART_COLUMNS =
  "id, assembly_id, part_number, part_name, revision, material, weight, manufacturing_status, owner_id, supplier, description, inventory_item_id, asset_id, material_quantity, created_at, updated_at";

type PartRow = {
  id: string;
  assembly_id: string;
  part_number: string;
  part_name: string;
  revision: string;
  material: string | null;
  weight: number | null;
  manufacturing_status: ManufacturingStatus;
  owner_id: string | null;
  supplier: string | null;
  description: string | null;
  inventory_item_id: string | null;
  asset_id: string | null;
  material_quantity: number;
  created_at: string;
  updated_at: string;
};

async function attachOwnerNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerIds: string[],
): Promise<Map<string, string | null>> {
  const uniqueIds = Array.from(new Set(ownerIds.filter((id): id is string => Boolean(id))));
  if (uniqueIds.length === 0) return new Map();

  const { data } = await supabase.from("profiles").select("id, full_name").in("id", uniqueIds);

  return new Map((data ?? []).map((row) => [row.id, row.full_name]));
}

type InventoryItemCostInfo = { itemCode: string; itemName: string; unitCost: number | null };
type AssetCostInfo = { assetNumber: string; assetName: string; unitCost: number | null };

async function attachInventoryItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  inventoryItemIds: string[],
): Promise<Map<string, InventoryItemCostInfo>> {
  const uniqueIds = Array.from(new Set(inventoryItemIds.filter((id): id is string => Boolean(id))));
  if (uniqueIds.length === 0) return new Map();

  const { data } = await supabase.from("inventory_items").select("id, item_code, item_name, unit_cost").in("id", uniqueIds);

  return new Map(
    (data ?? []).map((row) => [row.id, { itemCode: row.item_code, itemName: row.item_name, unitCost: row.unit_cost }]),
  );
}

async function attachAssets(
  supabase: Awaited<ReturnType<typeof createClient>>,
  assetIds: string[],
): Promise<Map<string, AssetCostInfo>> {
  const uniqueIds = Array.from(new Set(assetIds.filter((id): id is string => Boolean(id))));
  if (uniqueIds.length === 0) return new Map();

  const { data } = await supabase.from("assets").select("id, asset_number, asset_name, purchase_cost").in("id", uniqueIds);

  return new Map(
    (data ?? []).map((row) => [row.id, { assetNumber: row.asset_number, assetName: row.asset_name, unitCost: row.purchase_cost }]),
  );
}

function mapPartRow(
  row: PartRow,
  ownerNames: Map<string, string | null>,
  inventoryItems: Map<string, InventoryItemCostInfo>,
  assets: Map<string, AssetCostInfo>,
): BomPart {
  const inventoryItem = row.inventory_item_id ? inventoryItems.get(row.inventory_item_id) : undefined;
  const asset = row.asset_id ? assets.get(row.asset_id) : undefined;
  const materialUnitCost = inventoryItem?.unitCost ?? asset?.unitCost ?? null;

  return {
    id: row.id,
    assemblyId: row.assembly_id,
    partNumber: row.part_number,
    partName: row.part_name,
    revision: row.revision,
    material: row.material,
    weight: row.weight,
    manufacturingStatus: row.manufacturing_status,
    ownerId: row.owner_id,
    ownerName: row.owner_id ? (ownerNames.get(row.owner_id) ?? null) : null,
    supplier: row.supplier,
    description: row.description,
    inventoryItemId: row.inventory_item_id,
    inventoryItemCode: inventoryItem?.itemCode ?? null,
    inventoryItemName: inventoryItem?.itemName ?? null,
    assetId: row.asset_id,
    assetNumber: asset?.assetNumber ?? null,
    assetName: asset?.assetName ?? null,
    materialQuantity: row.material_quantity,
    materialUnitCost,
    materialCost: materialUnitCost !== null ? materialUnitCost * row.material_quantity : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listParts(params: ListPartsParams): Promise<ListPartsResult> {
  const supabase = await createClient();
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("bom_parts").select(PART_COLUMNS, { count: "exact" }).eq("assembly_id", params.assemblyId);

  if (params.search) {
    const term = params.search.replace(/[%,]/g, "");
    query = query.or(`part_number.ilike.%${term}%,part_name.ilike.%${term}%`);
  }
  if (params.status) {
    query = query.eq("manufacturing_status", params.status);
  }

  const sortField = params.sortField ?? "updated_at";
  const sortDirection = params.sortDirection ?? "desc";
  query = query.order(sortField, { ascending: sortDirection === "asc" });

  const { data, count } = await query.range(from, to);
  const rows = (data ?? []) as PartRow[];

  const [ownerNames, inventoryItems, assets] = await Promise.all([
    attachOwnerNames(
      supabase,
      rows.map((row) => row.owner_id).filter((id): id is string => Boolean(id)),
    ),
    attachInventoryItems(
      supabase,
      rows.map((row) => row.inventory_item_id).filter((id): id is string => Boolean(id)),
    ),
    attachAssets(
      supabase,
      rows.map((row) => row.asset_id).filter((id): id is string => Boolean(id)),
    ),
  ]);

  return {
    parts: rows.map((row) => mapPartRow(row, ownerNames, inventoryItems, assets)),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getPart(id: string): Promise<BomPart | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("bom_parts").select(PART_COLUMNS).eq("id", id).single();

  if (!row) return null;

  const [ownerNames, inventoryItems, assets] = await Promise.all([
    attachOwnerNames(supabase, row.owner_id ? [row.owner_id] : []),
    attachInventoryItems(supabase, row.inventory_item_id ? [row.inventory_item_id] : []),
    attachAssets(supabase, row.asset_id ? [row.asset_id] : []),
  ]);
  return mapPartRow(row as PartRow, ownerNames, inventoryItems, assets);
}

export async function listPartRevisions(partId: string): Promise<BomPartRevision[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bom_part_revisions")
    .select(
      "id, revision, part_name, material, weight, manufacturing_status, supplier, description, recorded_at, recorded_by",
    )
    .eq("part_id", partId)
    .order("recorded_at", { ascending: false });

  const rows = data ?? [];
  const recordedByNames = await attachOwnerNames(
    supabase,
    rows.map((row) => row.recorded_by).filter((id): id is string => Boolean(id)),
  );

  return rows.map((row) => ({
    id: row.id,
    revision: row.revision,
    partName: row.part_name,
    material: row.material,
    weight: row.weight,
    manufacturingStatus: row.manufacturing_status,
    supplier: row.supplier,
    description: row.description,
    recordedAt: row.recorded_at,
    recordedByName: row.recorded_by ? (recordedByNames.get(row.recorded_by) ?? null) : null,
  }));
}

export interface BomPartOption {
  id: string;
  partNumber: string;
  partName: string;
  category: BomCategory | null;
}

// assembly_id 목록을 한 번에 훑어 엔지니어링 카테고리로 매핑한다 (N+1 쿼리 방지용 배치 조회).
export async function resolveAssemblyCategoriesBatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  assemblyIds: string[],
): Promise<Map<string, BomCategory | null>> {
  if (assemblyIds.length === 0) return new Map();

  const { data: assemblies } = await supabase.from("assemblies").select("id, subsystem_id").in("id", assemblyIds);
  const subsystemIds = Array.from(new Set((assemblies ?? []).map((row) => row.subsystem_id)));

  const { data: subsystems } =
    subsystemIds.length > 0
      ? await supabase.from("subsystems").select("id, category_id").in("id", subsystemIds)
      : { data: [] as { id: string; category_id: string }[] };
  const categoryIds = Array.from(new Set((subsystems ?? []).map((row) => row.category_id)));

  const { data: categories } =
    categoryIds.length > 0
      ? await supabase.from("engineering_categories").select("id, name").in("id", categoryIds)
      : { data: [] as { id: string; name: BomCategory }[] };

  const categoryByCategoryId = new Map((categories ?? []).map((row) => [row.id, row.name]));
  const categoryBySubsystemId = new Map(
    (subsystems ?? []).map((row) => [row.id, categoryByCategoryId.get(row.category_id) ?? null]),
  );

  return new Map((assemblies ?? []).map((row) => [row.id, categoryBySubsystemId.get(row.subsystem_id) ?? null]));
}

// 재고 모듈의 "부품 선택" 드롭다운 등에서 쓰는, 계층 전체를 훑어 카테고리까지 붙인 옵션 목록.
export async function listBomPartOptions(): Promise<BomPartOption[]> {
  const supabase = await createClient();

  const { data: parts } = await supabase
    .from("bom_parts")
    .select("id, part_number, part_name, assembly_id")
    .order("part_number", { ascending: true });

  const rows = parts ?? [];
  const assemblyIds = Array.from(new Set(rows.map((row) => row.assembly_id)));
  const categoryByAssemblyId = await resolveAssemblyCategoriesBatch(supabase, assemblyIds);

  return rows.map((row) => ({
    id: row.id,
    partNumber: row.part_number,
    partName: row.part_name,
    category: categoryByAssemblyId.get(row.assembly_id) ?? null,
  }));
}

export interface PartOption {
  id: string;
  partNumber: string;
  partName: string;
}

export async function listPartOptionsForAssembly(assemblyId: string): Promise<PartOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bom_parts")
    .select("id, part_number, part_name")
    .eq("assembly_id", assemblyId)
    .order("part_number", { ascending: true });

  return (data ?? []).map((row) => ({ id: row.id, partNumber: row.part_number, partName: row.part_name }));
}

export interface MaterialCostByCategory {
  category: BomCategory;
  categoryLabel: string;
  totalCost: number;
}

export interface VehicleMaterialCost {
  totalCost: number;
  byCategory: MaterialCostByCategory[];
}

type MaterialSourceRow = { assembly_id: string; inventory_item_id: string | null; asset_id: string | null; material_quantity: number };

async function sumMaterialCost(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: MaterialSourceRow[],
): Promise<{ total: number; costByAssemblyId: Map<string, number> }> {
  const inventoryItems = await attachInventoryItems(
    supabase,
    rows.map((row) => row.inventory_item_id).filter((id): id is string => Boolean(id)),
  );
  const assets = await attachAssets(
    supabase,
    rows.map((row) => row.asset_id).filter((id): id is string => Boolean(id)),
  );

  let total = 0;
  const costByAssemblyId = new Map<string, number>();

  for (const row of rows) {
    const unitCost = row.inventory_item_id
      ? (inventoryItems.get(row.inventory_item_id)?.unitCost ?? null)
      : row.asset_id
        ? (assets.get(row.asset_id)?.unitCost ?? null)
        : null;
    if (unitCost === null) continue;

    const cost = unitCost * row.material_quantity;
    total += cost;
    costByAssemblyId.set(row.assembly_id, (costByAssemblyId.get(row.assembly_id) ?? 0) + cost);
  }

  return { total, costByAssemblyId };
}

// 부품에 연결된 재고 항목 또는 자산의 단가 × 소요 수량을 합산해 조립품 단위 예상 자재비를 계산한다.
export async function getAssemblyMaterialCost(assemblyId: string): Promise<number> {
  const supabase = await createClient();

  const { data: parts } = await supabase
    .from("bom_parts")
    .select("assembly_id, inventory_item_id, asset_id, material_quantity")
    .eq("assembly_id", assemblyId)
    .or("inventory_item_id.not.is.null,asset_id.not.is.null");

  const rows = (parts ?? []) as MaterialSourceRow[];
  if (rows.length === 0) return 0;

  const { total } = await sumMaterialCost(supabase, rows);
  return total;
}

// 차량 전체(모든 카테고리/서브시스템/조립품/부품)를 훑어 예상 자재비를 카테고리별로 합산한다.
export async function getVehicleMaterialCost(vehicleId: string): Promise<VehicleMaterialCost> {
  const supabase = await createClient();

  const { data: categories } = await supabase.from("engineering_categories").select("id, name").eq("vehicle_id", vehicleId);
  const categoryRows = categories ?? [];
  const categoryIds = categoryRows.map((row) => row.id);

  const { data: subsystems } =
    categoryIds.length > 0
      ? await supabase.from("subsystems").select("id, category_id").in("category_id", categoryIds)
      : { data: [] as { id: string; category_id: string }[] };
  const subsystemIds = (subsystems ?? []).map((row) => row.id);

  const { data: assemblies } =
    subsystemIds.length > 0
      ? await supabase.from("assemblies").select("id, subsystem_id").in("subsystem_id", subsystemIds)
      : { data: [] as { id: string; subsystem_id: string }[] };
  const assemblyIds = (assemblies ?? []).map((row) => row.id);

  const emptyByCategory: MaterialCostByCategory[] = BOM_CATEGORIES.map((category) => ({
    category,
    categoryLabel: BOM_CATEGORY_LABELS[category],
    totalCost: 0,
  }));

  if (assemblyIds.length === 0) {
    return { totalCost: 0, byCategory: emptyByCategory };
  }

  const { data: parts } = await supabase
    .from("bom_parts")
    .select("assembly_id, inventory_item_id, asset_id, material_quantity")
    .in("assembly_id", assemblyIds)
    .or("inventory_item_id.not.is.null,asset_id.not.is.null");

  const rows = (parts ?? []) as MaterialSourceRow[];
  if (rows.length === 0) {
    return { totalCost: 0, byCategory: emptyByCategory };
  }

  const { total, costByAssemblyId } = await sumMaterialCost(supabase, rows);

  const subsystemByAssemblyId = new Map((assemblies ?? []).map((row) => [row.id, row.subsystem_id]));
  const categoryIdBySubsystemId = new Map((subsystems ?? []).map((row) => [row.id, row.category_id]));
  const categoryNameByCategoryId = new Map(categoryRows.map((row) => [row.id, row.name]));

  const costByCategory = new Map<BomCategory, number>();

  for (const [assemblyId, cost] of costByAssemblyId) {
    const subsystemId = subsystemByAssemblyId.get(assemblyId);
    const categoryId = subsystemId ? categoryIdBySubsystemId.get(subsystemId) : undefined;
    const categoryName = categoryId ? categoryNameByCategoryId.get(categoryId) : undefined;
    if (categoryName) {
      costByCategory.set(categoryName, (costByCategory.get(categoryName) ?? 0) + cost);
    }
  }

  const byCategory: MaterialCostByCategory[] = BOM_CATEGORIES.map((category) => ({
    category,
    categoryLabel: BOM_CATEGORY_LABELS[category],
    totalCost: costByCategory.get(category) ?? 0,
  }));

  return { totalCost: total, byCategory };
}
