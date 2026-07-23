"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createFastener, type FastenerActionState } from "@/features/fasteners/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FastenerActionState = {};

export function CreateFastenerButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createFastener, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("체결류를 등록했습니다.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 액션 완료(외부 이벤트)에 반응해 다이얼로그를 닫는다.
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        체결류 등록
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>체결류 등록</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" name="name" placeholder="예: M8x20 볼트" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="spec">규격 (선택)</Label>
              <Input id="spec" name="spec" placeholder="예: SUS304" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="unitCost">단가 (원, 선택)</Label>
                <Input id="unitCost" name="unitCost" type="number" min={0} step={10} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="supplier">구매처 (선택)</Label>
                <Input id="supplier" name="supplier" placeholder="예: 세종볼트" />
              </div>
            </div>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "저장 중..." : "등록"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
