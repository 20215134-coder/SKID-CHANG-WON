"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { deletePart } from "@/features/bom/actions";
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
import { PartFormSheet } from "@/components/bom/part-form-sheet";
import type { AssetOption } from "@/services/asset-service";
import type { InventoryItemOption } from "@/services/inventory-service";
import type { MemberOption } from "@/services/team-service";
import type { BomPart } from "@/services/bom-service";
import type { AuthProfile } from "@/types/auth";

export function PartRowActions({
  part,
  actingProfile,
  memberOptions,
  itemOptions,
  assetOptions,
}: {
  part: BomPart;
  actingProfile: Pick<AuthProfile, "role" | "bomCategory">;
  memberOptions: MemberOption[];
  itemOptions: InventoryItemOption[];
  assetOptions: AssetOption[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const isAdmin = actingProfile.role === "admin";

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePart(part.id);
      if (result.error) toast.error(result.error);
      else toast.success(`${part.partNumber}을(를) 삭제했습니다.`);
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
          {isAdmin ? (
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
              삭제
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <PartFormSheet
        mode="edit"
        assemblyId={part.assemblyId}
        part={part}
        open={editOpen}
        onOpenChange={setEditOpen}
        memberOptions={memberOptions}
        itemOptions={itemOptions}
        assetOptions={assetOptions}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{part.partNumber}을(를) 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              부품과 첨부된 엔지니어링 파일이 함께 삭제됩니다. Revision 이력은 함께 삭제되며 복구할 수 없습니다.
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
