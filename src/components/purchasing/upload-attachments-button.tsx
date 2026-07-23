"use client";

import { useActionState, useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { uploadPurchaseRequestFiles, type PurchaseActionState } from "@/features/purchasing/actions";
import { PURCHASE_FILE_ACCEPT } from "@/lib/purchasing/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: PurchaseActionState = {};

export function UploadAttachmentsButton({ purchaseRequestId }: { purchaseRequestId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(uploadPurchaseRequestFiles, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("첨부 파일을 업로드했습니다.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 액션 완료(외부 이벤트)에 반응해 다이얼로그를 닫는다.
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Upload />
        첨부 파일 추가
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>첨부 파일 추가</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="purchaseRequestId" value={purchaseRequestId} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="files">파일 선택 (PDF/PNG/JPG)</Label>
              <Input id="files" name="files" type="file" accept={PURCHASE_FILE_ACCEPT} multiple required />
            </div>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "업로드 중..." : "업로드"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
