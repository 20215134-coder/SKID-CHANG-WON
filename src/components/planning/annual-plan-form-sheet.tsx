"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { createAnnualPlan, updateAnnualPlan, type PlanningActionState } from "@/features/planning/actions";
import { ANNUAL_PLAN_STATUS_LABELS, ANNUAL_PLAN_STATUSES } from "@/lib/planning/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { AnnualPlan } from "@/services/annual-plan-service";
import type { AnnualPlanStatus } from "@/types/database.types";

const initialState: PlanningActionState = {};

export function AnnualPlanFormSheet({
  mode,
  plan,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  plan?: AnnualPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const action = mode === "create" ? createAnnualPlan : updateAnnualPlan;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [status, setStatus] = useState<AnnualPlanStatus>(plan?.status ?? "planning");

  useEffect(() => {
    if (state.success) {
      toast.success(mode === "create" ? "연간 계획을 생성했습니다." : "연간 계획을 수정했습니다.");
      onOpenChange(false);
    }
  }, [state.success, mode, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "연간 계획 생성" : `연간 계획 수정 · ${plan?.title}`}</SheetTitle>
        </SheetHeader>

        <form action={formAction} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          {mode === "edit" && plan ? <input type="hidden" name="id" value={plan.id} /> : null}
          <input type="hidden" name="status" value={status} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">제목</Label>
            <Input id="title" name="title" defaultValue={plan?.title ?? ""} placeholder="예: 2027 Formula SAE Development Plan" required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">설명</Label>
            <Textarea id="description" name="description" defaultValue={plan?.description ?? ""} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="season">시즌 (연도)</Label>
              <Input id="season" name="season" type="number" defaultValue={plan?.season ?? new Date().getFullYear() + 1} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label>상태</Label>
              <Select value={status} onValueChange={(value) => setStatus((value ?? "planning") as AnnualPlanStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANNUAL_PLAN_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ANNUAL_PLAN_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">시작일</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={plan?.startDate ?? ""} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="endDate">종료일</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={plan?.endDate ?? ""} required />
            </div>
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {pending ? "저장 중..." : "저장"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
