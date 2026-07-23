"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteWorkJournal } from "@/features/work-journal/actions";
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

export function DeleteWorkJournalButton({ id, title, redirectTo }: { id: string; title: string; redirectTo?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteWorkJournal(id);
      if (result.error) {
        toast.error(result.error);
        setOpen(false);
        return;
      }
      toast.success(`${title}을(를) 삭제했습니다.`);
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
    });
  }

  return (
    <>
      <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 />
        삭제
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}을(를) 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 작업일지와 첨부파일은 복구할 수 없습니다. 차감됐던 소모품 재고는 자동으로 반납됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={pending}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
