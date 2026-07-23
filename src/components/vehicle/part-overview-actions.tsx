"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { PartFormSheet } from "@/components/bom/part-form-sheet";
import type { AssetOption } from "@/services/asset-service";
import type { InventoryItemOption } from "@/services/inventory-service";
import type { MemberOption } from "@/services/team-service";
import type { BomPart } from "@/services/bom-service";

export function PartOverviewActions({
  part,
  memberOptions,
  itemOptions,
  assetOptions,
  canDelete,
}: {
  part: BomPart;
  memberOptions: MemberOption[];
  itemOptions: InventoryItemOption[];
  assetOptions: AssetOption[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePart(part.id);
      if (result.error) {
        toast.error(result.error);
        setDeleteOpen(false);
        return;
      }
      toast.success(`${part.partNumber}을(를) 삭제했습니다.`);
      router.push(`/dashboard/vehicle`);
    });
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Pencil />
        수정
      </Button>
      {canDelete ? (
        <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash2 />
          삭제
        </Button>
      ) : null}

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
    </div>
  );
}
