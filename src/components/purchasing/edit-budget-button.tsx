"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { updateBudgetAllocation, type BudgetActionState } from "@/features/budgets/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: BudgetActionState = {};

export function EditBudgetButton({
  budgetId,
  label,
  allocatedBudget,
}: {
  budgetId: string;
  label: string;
  allocatedBudget: number;
}) {
  const [open, setOpen] = useState(false);
  // 다이얼로그를 여는 시점의 값으로 고정한다. allocatedBudget prop은 저장 후
  // 서버 재검증으로 다이얼로그가 열려 있는 동안에도 바뀔 수 있는데, 이미 마운트된
  // 비제어 Input의 defaultValue가 그대로 바뀌면 Base UI 경고가 발생하기 때문이다.
  const [initialValue, setInitialValue] = useState(allocatedBudget);
  const [state, formAction, pending] = useActionState(updateBudgetAllocation, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("예산을 수정했습니다.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 액션 완료(외부 이벤트)에 반응해 다이얼로그를 닫는다.
      setOpen(false);
    }
  }, [state.success]);

  function handleOpen() {
    setInitialValue(allocatedBudget);
    setOpen(true);
  }

  return (
    <>
      <Button variant="ghost" size="icon" className="size-8" onClick={handleOpen} title={`${label} 예산 수정`} aria-label={`${label} 예산 수정`}>
        <Pencil className="size-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{label} 예산 수정</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={budgetId} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="allocatedBudget">배정 예산 (원)</Label>
              <Input
                id="allocatedBudget"
                name="allocatedBudget"
                type="number"
                min={0}
                step={1000}
                defaultValue={initialValue}
                required
              />
            </div>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "저장 중..." : "저장"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
