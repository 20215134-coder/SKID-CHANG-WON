"use client";

import { useState } from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { formatCurrency } from "@/lib/purchasing/format";
import { EditBudgetButton } from "@/components/purchasing/edit-budget-button";
import type { Budget } from "@/services/budget-service";

export type BudgetWithPermission = Budget & { canManage: boolean };

function WarningBadge({ budget }: { budget: Budget }) {
  if (budget.isOverBudget) {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-4xl bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        <AlertTriangle className="size-3" />
        예산 초과
      </span>
    );
  }
  if (budget.isLowRemaining) {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-4xl bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
        <AlertTriangle className="size-3" />
        잔여 20% 미만
      </span>
    );
  }
  return null;
}

function CategoryNode({ budget }: { budget: BudgetWithPermission }) {
  const canManage = budget.canManage;
  const label = budget.categoryName ? BOM_CATEGORY_LABELS[budget.categoryName] : "";
  const percent = Math.min(100, Math.round(budget.usagePercent));

  return (
    <div className="border-t py-3 pl-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-24 shrink-0 text-sm font-medium">{label}</span>
        <div className="h-2 min-w-24 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full",
              budget.isOverBudget ? "bg-destructive" : budget.isLowRemaining ? "bg-amber-500" : "bg-primary",
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">{percent}%</span>
        <WarningBadge budget={budget} />
        {canManage ? <EditBudgetButton budgetId={budget.id} label={label} allocatedBudget={budget.allocatedBudget} /> : null}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3 pl-[6.5rem] text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">배정 예산</p>
          <p>{formatCurrency(budget.allocatedBudget)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">사용</p>
          <p>{formatCurrency(budget.usedBudget)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">잔여</p>
          <p>{formatCurrency(budget.remainingBudget)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">사용률</p>
          <p>{Math.round(budget.usagePercent)}%</p>
        </div>
      </div>
    </div>
  );
}

export function VehicleBudgetTree({
  vehicleName,
  competitionYear,
  totalBudget,
  categoryBudgets,
}: {
  vehicleName: string;
  competitionYear: number;
  totalBudget: BudgetWithPermission;
  categoryBudgets: BudgetWithPermission[];
}) {
  const [expanded, setExpanded] = useState(true);
  const allocatedSum = categoryBudgets.reduce((sum, budget) => sum + budget.allocatedBudget, 0);
  const isOverAllocated = allocatedSum > totalBudget.allocatedBudget;
  const percent = Math.min(100, Math.round(totalBudget.usagePercent));

  return (
    <div className="rounded-lg border">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex size-5 shrink-0 items-center justify-center"
          aria-label={expanded ? "접기" : "펼치기"}
        >
          <ChevronRight className={cn("size-4 transition-transform", expanded && "rotate-90")} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {competitionYear} 시즌 예산 <span className="font-normal text-muted-foreground">· {vehicleName}</span>
          </p>
          <p className="truncate text-xs text-muted-foreground">
            총 예산 {formatCurrency(totalBudget.allocatedBudget)} · 사용 {formatCurrency(totalBudget.usedBudget)} · {percent}%
          </p>
        </div>
        <WarningBadge budget={totalBudget} />
        {isOverAllocated ? (
          <span className="flex shrink-0 items-center gap-1 rounded-4xl bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
            <AlertTriangle className="size-3" />
            카테고리 배정 합계 초과
          </span>
        ) : null}
        {totalBudget.canManage ? (
          <EditBudgetButton budgetId={totalBudget.id} label="전체 예산" allocatedBudget={totalBudget.allocatedBudget} />
        ) : null}
      </div>

      {expanded ? (
        <div>
          {categoryBudgets.map((budget) => (
            <CategoryNode key={budget.id} budget={budget} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
