"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { updateAssemblyFastenerQuantity, type FastenerActionState } from "@/features/fasteners/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FastenerActionState = {};

export function EditAssemblyFastenerButton({
  id,
  name,
  quantity,
}: {
  id: string;
  name: string;
  quantity: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateAssemblyFastenerQuantity, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("수량을 수정했습니다.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 액션 완료(외부 이벤트)에 반응해 다이얼로그를 닫는다.
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => setOpen(true)}
        title={`${name} 수량 수정`}
        aria-label={`${name} 수량 수정`}
      >
        <Pencil className="size-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{name} 수량 수정</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={id} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">수량</Label>
              <Input id="quantity" name="quantity" type="number" min={1} step={1} defaultValue={quantity} required />
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
