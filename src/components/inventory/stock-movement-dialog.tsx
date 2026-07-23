"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { adjustStock, stockIn, stockOut, transferStock, type InventoryActionState } from "@/features/inventory/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type MovementMode = "in" | "out" | "adjustment" | "transfer";

const initialState: InventoryActionState = {};

const MODE_CONFIG: Record<
  MovementMode,
  { title: string; description: string; action: typeof stockIn; submitLabel: string }
> = {
  in: { title: "입고", description: "재고를 추가합니다.", action: stockIn, submitLabel: "입고" },
  out: { title: "출고", description: "재고를 차감합니다.", action: stockOut, submitLabel: "출고" },
  adjustment: { title: "재고 조정", description: "실사 수량으로 재고를 맞춥니다. 관리자만 가능합니다.", action: adjustStock, submitLabel: "조정" },
  transfer: { title: "보관 위치 이동", description: "항목 전체를 새 보관 위치로 옮깁니다.", action: transferStock, submitLabel: "이동" },
};

export function StockMovementDialog({
  itemId,
  currentQuantity,
  currentLocation,
  mode,
  open,
  onOpenChange,
}: {
  itemId: string;
  currentQuantity: number;
  currentLocation: string | null;
  mode: MovementMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const config = MODE_CONFIG[mode];
  const [state, formAction, pending] = useActionState(config.action, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(`${config.submitLabel} 처리했습니다.`);
      onOpenChange(false);
    }
  }, [state.success, onOpenChange, config.submitLabel]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="itemId" value={itemId} />

          {mode === "in" || mode === "out" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">수량</Label>
              <Input id="quantity" name="quantity" type="number" min={0} step="0.01" required />
              <p className="text-xs text-muted-foreground">현재 수량: {currentQuantity}</p>
            </div>
          ) : null}

          {mode === "adjustment" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="newQuantity">실사 수량</Label>
              <Input id="newQuantity" name="newQuantity" type="number" min={0} step="0.01" defaultValue={currentQuantity} required />
            </div>
          ) : null}

          {mode === "transfer" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="newLocation">새 보관 위치</Label>
              <Input id="newLocation" name="newLocation" required />
              <p className="text-xs text-muted-foreground">현재 위치: {currentLocation ?? "미지정"}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">사유 (선택)</Label>
            <Textarea id="reason" name="reason" rows={2} />
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "처리 중..." : config.submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
