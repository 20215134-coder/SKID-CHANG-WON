"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { getBudget } from "@/services/budget-service";

export interface BudgetActionState {
  error?: string;
  success?: boolean;
}

export async function updateBudgetAllocation(
  _prevState: BudgetActionState,
  formData: FormData,
): Promise<BudgetActionState> {
  const profile = await requireUser();

  const id = formData.get("id");
  const allocatedBudget = formData.get("allocatedBudget");

  if (typeof id !== "string" || !id) {
    return { error: "잘못된 요청입니다." };
  }

  const budget = await getBudget(id);
  if (!budget) {
    return { error: "예산 항목을 찾을 수 없습니다." };
  }

  const canManage =
    profile.role === "admin" ||
    (profile.role === "leader" && budget.categoryId !== null && budget.categoryName === profile.bomCategory);

  if (!canManage) {
    return { error: "이 예산을 수정할 권한이 없습니다." };
  }

  const amount = Number(allocatedBudget);
  if (!Number.isFinite(amount) || amount < 0) {
    return { error: "예산은 0 이상의 숫자여야 합니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("budgets").update({ allocated_budget: amount }).eq("id", id);

  if (error) {
    return { error: "예산 수정 중 오류가 발생했습니다." };
  }

  revalidatePath("/dashboard/purchasing", "layout");
  return { success: true };
}
