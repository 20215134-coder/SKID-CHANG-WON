"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createSubsystem, type VehicleActionState } from "@/features/vehicle/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: VehicleActionState = {};

export function CreateSubsystemButton({ categoryId }: { categoryId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createSubsystem, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Subsystem을 생성했습니다.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 액션 완료(외부 이벤트)에 반응해 다이얼로그를 닫는다.
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Subsystem 생성
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subsystem 생성</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="categoryId" value={categoryId} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" name="name" placeholder="예: Brake" required />
            </div>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "생성 중..." : "생성"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
