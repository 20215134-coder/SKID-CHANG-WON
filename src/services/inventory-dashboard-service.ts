import { createClient } from "@/lib/supabase/server";
import { listInventoryMovements, type InventoryMovementEntry } from "@/services/inventory-service";

export interface InventoryDashboardStats {
  totalItems: number;
  totalAssetValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentMovements: InventoryMovementEntry[];
}

export async function getInventoryDashboardStats(): Promise<InventoryDashboardStats> {
  const supabase = await createClient();

  const [{ count: totalItems }, { count: lowStockCount }, { count: outOfStockCount }, { data: valueRows }, { entries: recentMovements }] =
    await Promise.all([
      supabase.from("inventory_items").select("id", { count: "exact", head: true }),
      supabase.from("inventory_items").select("id", { count: "exact", head: true }).eq("status", "low_stock"),
      supabase.from("inventory_items").select("id", { count: "exact", head: true }).eq("status", "out_of_stock"),
      supabase.from("inventory_items").select("total_asset_value"),
      listInventoryMovements({ page: 1, pageSize: 5 }),
    ]);

  const totalAssetValue = (valueRows ?? []).reduce((sum, row) => sum + row.total_asset_value, 0);

  return {
    totalItems: totalItems ?? 0,
    totalAssetValue,
    lowStockCount: lowStockCount ?? 0,
    outOfStockCount: outOfStockCount ?? 0,
    recentMovements,
  };
}
