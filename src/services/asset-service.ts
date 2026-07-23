import { createClient } from "@/lib/supabase/server";
import type { AssetCondition, BomCategory } from "@/types/database.types";

export interface Asset {
  id: string;
  assetNumber: string;
  assetName: string;
  engineeringCategory: BomCategory | null;
  description: string | null;
  currentCondition: AssetCondition;
  purchaseDate: string | null;
  purchaseCost: number | null;
  assignedToId: string | null;
  assignedToName: string | null;
  notes: string | null;
  sourcePurchaseRequestId: string | null;
  createdAt: string;
  updatedAt: string;
}

const ASSET_COLUMNS =
  "id, asset_number, asset_name, engineering_category, description, current_condition, purchase_date, purchase_cost, assigned_to, notes, source_purchase_request_id, created_at, updated_at";

type AssetRow = {
  id: string;
  asset_number: string;
  asset_name: string;
  engineering_category: BomCategory | null;
  description: string | null;
  current_condition: AssetCondition;
  purchase_date: string | null;
  purchase_cost: number | null;
  assigned_to: string | null;
  notes: string | null;
  source_purchase_request_id: string | null;
  created_at: string;
  updated_at: string;
};

async function mapAssetRows(supabase: Awaited<ReturnType<typeof createClient>>, rows: AssetRow[]): Promise<Asset[]> {
  if (rows.length === 0) return [];

  const assigneeIds = Array.from(new Set(rows.map((row) => row.assigned_to).filter((id): id is string => Boolean(id))));
  const { data: assignees } =
    assigneeIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", assigneeIds)
      : { data: [] as { id: string; full_name: string | null }[] };

  const nameByAssigneeId = new Map((assignees ?? []).map((row) => [row.id, row.full_name]));

  return rows.map((row) => ({
    id: row.id,
    assetNumber: row.asset_number,
    assetName: row.asset_name,
    engineeringCategory: row.engineering_category,
    description: row.description,
    currentCondition: row.current_condition,
    purchaseDate: row.purchase_date,
    purchaseCost: row.purchase_cost,
    assignedToId: row.assigned_to,
    assignedToName: row.assigned_to ? (nameByAssigneeId.get(row.assigned_to) ?? null) : null,
    notes: row.notes,
    sourcePurchaseRequestId: row.source_purchase_request_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export interface ListAssetsParams {
  search?: string;
  condition?: AssetCondition;
  category?: BomCategory;
  page?: number;
  pageSize?: number;
}

export interface ListAssetsResult {
  assets: Asset[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 10;

export async function listAssets(params: ListAssetsParams): Promise<ListAssetsResult> {
  const supabase = await createClient();
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("assets").select(ASSET_COLUMNS, { count: "exact" }).order("created_at", { ascending: false });

  if (params.search) {
    const term = params.search.replace(/[%,]/g, "");
    query = query.or(`asset_number.ilike.%${term}%,asset_name.ilike.%${term}%`);
  }
  if (params.condition) {
    query = query.eq("current_condition", params.condition);
  }
  if (params.category) {
    query = query.eq("engineering_category", params.category);
  }

  const { data, count } = await query.range(from, to);
  const rows = (data ?? []) as AssetRow[];

  return {
    assets: await mapAssetRows(supabase, rows),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getAsset(id: string): Promise<Asset | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("assets").select(ASSET_COLUMNS).eq("id", id).single();
  if (!row) return null;

  const mapped = await mapAssetRows(supabase, [row as AssetRow]);
  return mapped[0] ?? null;
}

export interface AssetOption {
  id: string;
  assetNumber: string;
  assetName: string;
  purchaseCost: number | null;
}

export async function listAssetOptions(): Promise<AssetOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assets")
    .select("id, asset_number, asset_name, purchase_cost")
    .order("asset_number", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    assetNumber: row.asset_number,
    assetName: row.asset_name,
    purchaseCost: row.purchase_cost,
  }));
}
