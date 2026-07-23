"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { addAssemblyFastener, type FastenerActionState } from "@/features/fasteners/actions";
import { NEW_FASTENER_VALUE } from "@/features/fasteners/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FastenerOption } from "@/services/fastener-service";

const initialState: FastenerActionState = {};

export function AddAssemblyFastenerButton({
  assemblyId,
  fastenerOptions,
}: {
  assemblyId: string;
  fastenerOptions: FastenerOption[];
}) {
  const [open, setOpen] = useState(false);
  const [fastenerId, setFastenerId] = useState(fastenerOptions[0]?.id ?? NEW_FASTENER_VALUE);
  const [state, formAction, pending] = useActionState(addAssemblyFastener, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("체결류를 등록했습니다.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 액션 완료(외부 이벤트)에 반응해 다이얼로그를 닫는다.
      setOpen(false);
    }
  }, [state.success]);

  const isNew = fastenerId === NEW_FASTENER_VALUE;

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus />
        체결류 추가
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>체결류 추가</DialogTitle>
            <DialogDescription>기존 카탈로그에서 선택하거나, 새 체결류를 즉석에서 등록할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="assemblyId" value={assemblyId} />
            <input type="hidden" name="fastenerId" value={fastenerId} />

            <div className="flex flex-col gap-2">
              <Label>체결류</Label>
              <Select value={fastenerId} onValueChange={(value) => setFastenerId(value ?? NEW_FASTENER_VALUE)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="체결류 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NEW_FASTENER_VALUE}>+ 새 체결류 등록</SelectItem>
                  {fastenerOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                      {option.spec ? ` · ${option.spec}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isNew ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="newFastenerName">이름</Label>
                  <Input id="newFastenerName" name="newFastenerName" placeholder="예: M8x20 볼트" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="newFastenerSpec">규격 (선택)</Label>
                  <Input id="newFastenerSpec" name="newFastenerSpec" placeholder="예: SUS304" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="newFastenerUnitCost">단가 (원, 선택)</Label>
                  <Input id="newFastenerUnitCost" name="newFastenerUnitCost" type="number" min={0} step={10} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="newFastenerSupplier">구매처 (선택)</Label>
                  <Input id="newFastenerSupplier" name="newFastenerSupplier" placeholder="예: 세종볼트" />
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">수량</Label>
              <Input id="quantity" name="quantity" type="number" min={1} step={1} defaultValue={1} required />
            </div>

            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "저장 중..." : "저장"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
