"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { updateReceiptFile, type PurchaseActionState } from "@/features/purchasing/actions";
import { PURCHASE_FILE_ACCEPT } from "@/lib/purchasing/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: PurchaseActionState = {};

export function EditReceiptButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateReceiptFile, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("영수증을 교체했습니다.");
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
        title="영수증 수정"
        aria-label="영수증 수정"
      >
        <Pencil className="size-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>영수증 수정</DialogTitle>
            <DialogDescription>새 파일을 업로드하면 기존 영수증을 대체합니다.</DialogDescription>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={id} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="receiptFile">새 영수증 (PDF/PNG/JPG)</Label>
              <Input id="receiptFile" name="receiptFile" type="file" accept={PURCHASE_FILE_ACCEPT} required />
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
