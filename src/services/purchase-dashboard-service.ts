import { createClient } from "@/lib/supabase/server";
import { BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import type { BomCategory } from "@/types/database.types";

export interface PurchaseDashboardSummary {
  pendingApprovals: number;
  purchasesThisMonth: number;
  totalSpending: number;
  totalAllocated: number;
  totalRemaining: number;
  budgetUsagePercent: number;
}

export interface RecentPurchase {
  id: string;
  requestNumber: string;
  title: string;
  finalCost: number | null;
  purchasedAt: string | null;
}

export interface TopSpendingCategory {
  category: BomCategory;
  categoryLabel: string;
  totalSpent: number;
}

export interface TopSupplier {
  supplier: string;
  totalSpent: number;
}

export async function getPurchaseDashboardSummary(): Promise<PurchaseDashboardSummary> {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ count: pendingApprovals }, { data: purchasedRows }, { data: budgetRows }] = await Promise.all([
    supabase.from("purchase_requests").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
    supabase.from("purchase_requests").select("final_cost, purchased_at").eq("status", "purchased"),
    supabase.from("budgets").select("allocated_budget, used_budget").is("category_id", null),
  ]);

  const rows = purchasedRows ?? [];
  const totalSpending = rows.reduce((sum, row) => sum + (row.final_cost ?? 0), 0);
  const purchasesThisMonth = rows.filter(
    (row) => row.purchased_at && new Date(row.purchased_at) >= startOfMonth,
  ).length;

  const totalAllocated = (budgetRows ?? []).reduce((sum, row) => sum + row.allocated_budget, 0);
  const totalUsed = (budgetRows ?? []).reduce((sum, row) => sum + row.used_budget, 0);

  return {
    pendingApprovals: pendingApprovals ?? 0,
    purchasesThisMonth,
    totalSpending,
    totalAllocated,
    totalRemaining: totalAllocated - totalUsed,
    budgetUsagePercent: totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0,
  };
}

export async function listRecentPurchases(limit = 5): Promise<RecentPurchase[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_requests")
    .select("id, request_number, title, final_cost, purchased_at")
    .eq("status", "purchased")
    .order("purchased_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    requestNumber: row.request_number,
    title: row.title,
    finalCost: row.final_cost,
    purchasedAt: row.purchased_at,
  }));
}

export async function listTopSpendingCategories(limit = 5): Promise<TopSpendingCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("purchase_requests").select("category_id, final_cost").eq("status", "purchased");

  const rows = data ?? [];
  const categoryIds = Array.from(new Set(rows.map((row) => row.category_id)));

  const { data: categories } =
    categoryIds.length > 0
      ? await supabase.from("engineering_categories").select("id, name").in("id", categoryIds)
      : { data: [] as { id: string; name: BomCategory }[] };

  const categoryNameById = new Map((categories ?? []).map((row) => [row.id, row.name]));

  const totalsByCategory = new Map<BomCategory, number>();
  for (const row of rows) {
    const name = categoryNameById.get(row.category_id);
    if (!name) continue;
    totalsByCategory.set(name, (totalsByCategory.get(name) ?? 0) + (row.final_cost ?? 0));
  }

  return Array.from(totalsByCategory.entries())
    .map(([category, totalSpent]) => ({ category, categoryLabel: BOM_CATEGORY_LABELS[category], totalSpent }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

export async function listTopSuppliers(limit = 5): Promise<TopSupplier[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_requests")
    .select("supplier, final_cost")
    .eq("status", "purchased")
    .not("supplier", "is", null);

  const totalsBySupplier = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.supplier) continue;
    totalsBySupplier.set(row.supplier, (totalsBySupplier.get(row.supplier) ?? 0) + (row.final_cost ?? 0));
  }

  return Array.from(totalsBySupplier.entries())
    .map(([supplier, totalSpent]) => ({ supplier, totalSpent }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}
