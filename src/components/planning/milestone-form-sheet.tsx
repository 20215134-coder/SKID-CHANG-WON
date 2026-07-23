"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { createMilestone, updateMilestone, type PlanningActionState } from "@/features/planning/actions";
import { MILESTONE_STATUS_LABELS, MILESTONE_STATUSES } from "@/lib/planning/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { Milestone } from "@/services/milestone-service";
import type { MilestoneStatus } from "@/types/database.types";

const initialState: PlanningActionState = {};

export function MilestoneFormSheet({
  mode,
  annualPlanId,
  milestone,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  annualPlanId: string;
  milestone?: Milestone;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const action = mode === "create" ? createMilestone : updateMilestone;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [status, setStatus] = useState<MilestoneStatus>(milestone?.status ?? "planned");

  useEffect(() => {
    if (state.success) {
      toast.success(mode === "create" ? "마일스톤을 생성했습니다." : "마일스톤을 수정했습니다.");
      onOpenChange(false);
    }
  }, [state.success, mode, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "마일스톤 생성" : `마일스톤 수정 · ${milestone?.title}`}</SheetTitle>
        </SheetHeader>

        <form action={formAction} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          {mode === "edit" && milestone ? <input type="hidden" name="id" value={milestone.id} /> : null}
          <input type="hidden" name="annualPlanId" value={annualPlanId} />
          <input type="hidden" name="status" value={status} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">제목</Label>
            <Input id="title" name="title" defaultValue={milestone?.title ?? ""} placeholder="예: Frame Design Complete" required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">설명 (선택)</Label>
            <Textarea id="description" name="description" defaultValue={milestone?.description ?? ""} rows={2} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dueDate">마감일</Label>
            <Input id="dueDate" name="dueDate" type="date" defaultValue={milestone?.dueDate ?? ""} required />
          </div>

          <div className="flex flex-col gap-2">
            <Label>상태</Label>
            <Select value={status} onValueChange={(value) => setStatus((value ?? "planned") as MilestoneStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MILESTONE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {MILESTONE_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
