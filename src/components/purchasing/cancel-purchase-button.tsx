"use client";

import { useState, useTransition } from "react";
import { Ban } from "lucide-react";
import { toast } from "sonner";

import { cancelPurchaseRequest } from "@/features/purchasing/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function CancelPurchaseButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelPurchaseRequest(id);
      if (result.error) toast.error(result.error);
      else toast.success("구매 요청을 취소했습니다.");
      setOpen(false);
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Ban />
        취소
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>구매 요청을 취소할까요?</AlertDialogTitle>
            <AlertDialogDescription>취소 후에는 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>닫기</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={pending}>
              취소하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
