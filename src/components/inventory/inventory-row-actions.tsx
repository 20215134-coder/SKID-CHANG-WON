"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { deleteInventoryItem } from "@/features/inventory/actions";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InventoryFormSheet } from "@/components/inventory/inventory-form-sheet";
import { StockMovementDialog, type MovementMode } from "@/components/inventory/stock-movement-dialog";
import type { BomPartOption } from "@/services/bom-service";
import type { InventoryItem } from "@/services/inventory-service";

export function InventoryRowActions({
  item,
  partOptions,
  canDelete,
  canAdjust,
}: {
  item: InventoryItem;
  partOptions: BomPartOption[];
  canDelete: boolean;
  canAdjust: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [movementMode, setMovementMode] = useState<MovementMode | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteInventoryItem(item.id);
      if (result.error) toast.error(result.error);
      else toast.success(`${item.itemCode}을(를) 삭제했습니다.`);
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setMovementMode("in")}>입고</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMovementMode("out")}>출고</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMovementMode("transfer")}>보관 위치 이동</DropdownMenuItem>
          {canAdjust ? <DropdownMenuItem onClick={() => setMovementMode("adjustment")}>재고 조정</DropdownMenuItem> : null}
          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                삭제
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <InventoryFormSheet
        mode="edit"
        item={item}
        partOptions={partOptions}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {movementMode ? (
        <StockMovementDialog
          itemId={item.id}
          currentQuantity={item.currentQuantity}
          currentLocation={item.storageLocation}
          mode={movementMode}
          open={movementMode !== null}
          onOpenChange={(open) => {
            if (!open) setMovementMode(null);
          }}
        />
      ) : null}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{item.itemCode}을(를) 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>이동 이력 또는 연결된 자산이 있으면 삭제할 수 없습니다.</AlertDialogDescription>
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
