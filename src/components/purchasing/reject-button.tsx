"use client";

import { useActionState, useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { rejectPurchaseRequest, type PurchaseActionState } from "@/features/purchasing/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: PurchaseActionState = {};

export function RejectButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(rejectPurchaseRequest, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("반려했습니다.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 액션 완료(외부 이벤트)에 반응해 다이얼로그를 닫는다.
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <X />
        반려
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>구매 요청 반려</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={id} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="reason">반려 사유</Label>
              <Textarea id="reason" name="reason" rows={3} required />
            </div>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? "처리 중..." : "반려"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
