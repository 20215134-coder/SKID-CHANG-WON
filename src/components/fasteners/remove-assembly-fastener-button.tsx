"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { removeAssemblyFastener } from "@/features/fasteners/actions";
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

export function RemoveAssemblyFastenerButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      const result = await removeAssemblyFastener(id);
      if (result.error) toast.error(result.error);
      else toast.success(`${name}을(를) 삭제했습니다.`);
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
        title={`${name} 삭제`}
        aria-label={`${name} 삭제`}
      >
        <Trash2 className="size-3.5" />
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{name}을(를) 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>이 어셈블리에서 해당 체결류가 제거됩니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={pending}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
