"use client";

import { useActionState, useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { completePurchase, type PurchaseActionState } from "@/features/purchasing/actions";
import { PURCHASE_FILE_ACCEPT } from "@/lib/purchasing/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: PurchaseActionState = {};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CompletePurchaseButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(completePurchase, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("구매 완료로 처리했습니다.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 액션 완료(외부 이벤트)에 반응해 다이얼로그를 닫는다.
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <ShoppingCart />
        구매 완료 처리
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>구매 완료 처리</DialogTitle>
            <DialogDescription>최종 비용, 구매일, 영수증을 입력하면 상태가 구매 완료로 바뀝니다.</DialogDescription>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={id} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="finalCost">최종 비용 (원)</Label>
              <Input id="finalCost" name="finalCost" type="number" min={0} step={100} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="purchasedAt">구매일</Label>
              <Input id="purchasedAt" name="purchasedAt" type="date" defaultValue={today()} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="receiptFile">영수증 (PDF/PNG/JPG)</Label>
              <Input id="receiptFile" name="receiptFile" type="file" accept={PURCHASE_FILE_ACCEPT} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="purchaseNotes">구매 메모</Label>
              <Textarea id="purchaseNotes" name="purchaseNotes" rows={2} />
            </div>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "처리 중..." : "구매 완료"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
