"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { deleteAnnualPlan } from "@/features/planning/actions";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnnualPlanFormSheet } from "@/components/planning/annual-plan-form-sheet";
import type { AnnualPlan } from "@/services/annual-plan-service";

export function AnnualPlanRowActions({ plan, canDelete }: { plan: AnnualPlan; canDelete: boolean }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAnnualPlan(plan.id);
      if (result.error) toast.error(result.error);
      else toast.success(`${plan.title}을(를) 삭제했습니다.`);
      setDeleteOpen(false);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-md hover:bg-muted">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">작업</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>수정</DropdownMenuItem>
          {canDelete ? (
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
              삭제
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <AnnualPlanFormSheet mode="edit" plan={plan} open={editOpen} onOpenChange={setEditOpen} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{plan.title}을(를) 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>연결된 마일스톤이 모두 함께 삭제됩니다. 복구할 수 없습니다.</AlertDialogDescription>
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
