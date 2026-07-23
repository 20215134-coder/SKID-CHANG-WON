"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createAssembly, type VehicleActionState } from "@/features/vehicle/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: VehicleActionState = {};

export function CreateAssemblyButton({ subsystemId }: { subsystemId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createAssembly, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Assembly를 생성했습니다.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 액션 완료(외부 이벤트)에 반응해 다이얼로그를 닫는다.
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Assembly 생성
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assembly 생성</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="subsystemId" value={subsystemId} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" name="name" placeholder="예: Pedal Assembly" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="revision">Revision</Label>
              <Input id="revision" name="revision" defaultValue="A" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">설명</Label>
              <Textarea id="description" name="description" rows={2} />
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
