import { createClient } from "@/lib/supabase/server";
import type { BomCategory } from "@/types/database.types";

export interface Budget {
  id: string;
  vehicleId: string;
  vehicleName: string;
  categoryId: string | null;
  categoryName: BomCategory | null;
  allocatedBudget: number;
  usedBudget: number;
  remainingBudget: number;
  usagePercent: number;
  isOverBudget: boolean;
  isLowRemaining: boolean;
}

type BudgetRow = {
  id: string;
  vehicle_id: string;
  category_id: string | null;
  allocated_budget: number;
  used_budget: number;
  remaining_budget: number;
};

const BUDGET_COLUMNS = "id, vehicle_id, category_id, allocated_budget, used_budget, remaining_budget";

function mapBudget(row: BudgetRow, vehicleName: string, categoryName: BomCategory | null): Budget {
  const usagePercent = row.allocated_budget > 0 ? (row.used_budget / row.allocated_budget) * 100 : 0;
  const remainingRatio = row.allocated_budget > 0 ? row.remaining_budget / row.allocated_budget : 1;

  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    vehicleName,
    categoryId: row.category_id,
    categoryName,
    allocatedBudget: row.allocated_budget,
    usedBudget: row.used_budget,
    remainingBudget: row.remaining_budget,
    usagePercent,
    isOverBudget: row.used_budget > row.allocated_budget,
    isLowRemaining: row.allocated_budget > 0 && remainingRatio < 0.1 && remainingRatio >= 0,
  };
}

export async function listBudgetsForVehicle(vehicleId: string): Promise<Budget[]> {
  const supabase = await createClient();
  const [{ data: budgetRows }, { data: vehicle }, { data: categories }] = await Promise.all([
    supabase.from("budgets").select(BUDGET_COLUMNS).eq("vehicle_id", vehicleId),
    supabase.from("vehicles").select("vehicle_name").eq("id", vehicleId).single(),
    supabase.from("engineering_categories").select("id, name").eq("vehicle_id", vehicleId),
  ]);

  const categoryById = new Map((categories ?? []).map((row) => [row.id, row.name]));
  const vehicleName = vehicle?.vehicle_name ?? "";

  return (budgetRows ?? [])
    .map((row) => mapBudget(row as BudgetRow, vehicleName, row.category_id ? (categoryById.get(row.category_id) ?? null) : null))
    .sort((a, b) => {
      if (a.categoryId === null) return -1;
      if (b.categoryId === null) return 1;
      return (a.categoryName ?? "").localeCompare(b.categoryName ?? "");
    });
}

export async function listVehicleTotalBudgets(): Promise<Budget[]> {
  const supabase = await createClient();
  const { data: budgetRows } = await supabase.from("budgets").select(BUDGET_COLUMNS).is("category_id", null);

  const vehicleIds = (budgetRows ?? []).map((row) => row.vehicle_id);
  const { data: vehicles } =
    vehicleIds.length > 0
      ? await supabase.from("vehicles").select("id, vehicle_name").in("id", vehicleIds)
      : { data: [] as { id: string; vehicle_name: string }[] };

  const vehicleNameById = new Map((vehicles ?? []).map((row) => [row.id, row.vehicle_name]));

  return (budgetRows ?? []).map((row) => mapBudget(row as BudgetRow, vehicleNameById.get(row.vehicle_id) ?? "", null));
}

export async function getBudget(id: string): Promise<Budget | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("budgets").select(BUDGET_COLUMNS).eq("id", id).single();
  if (!row) return null;

  const [{ data: vehicle }, categoryName] = await Promise.all([
    supabase.from("vehicles").select("vehicle_name").eq("id", row.vehicle_id).single(),
    row.category_id
      ? supabase
          .from("engineering_categories")
          .select("name")
          .eq("id", row.category_id)
          .single()
          .then((result) => result.data?.name ?? null)
      : Promise.resolve(null),
  ]);

  return mapBudget(row as BudgetRow, vehicle?.vehicle_name ?? "", categoryName);
}
