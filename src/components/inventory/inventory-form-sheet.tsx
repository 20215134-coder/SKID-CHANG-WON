"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { createInventoryItem, updateInventoryItem, type InventoryActionState } from "@/features/inventory/actions";
import { INVENTORY_CATEGORIES, INVENTORY_CATEGORY_LABELS, INVENTORY_ITEM_STATUS_LABELS, INVENTORY_ITEM_STATUSES } from "@/lib/inventory/constants";
import { BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { BomPartOption } from "@/services/bom-service";
import type { InventoryItem } from "@/services/inventory-service";
import type { InventoryCategory, InventoryItemStatus } from "@/types/database.types";

const initialState: InventoryActionState = {};
const NONE_VALUE = "none";

export interface InventoryFormPrefill {
  itemName?: string;
  supplier?: string;
  currentQuantity?: number;
  unitCost?: number;
  sourcePurchaseRequestId?: string;
}

export function InventoryFormSheet({
  mode,
  item,
  partOptions,
  prefill,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  item?: InventoryItem;
  partOptions: BomPartOption[];
  prefill?: InventoryFormPrefill;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const action = mode === "create" ? createInventoryItem : updateInventoryItem;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [category, setCategory] = useState<InventoryCategory>(item?.category ?? "consumable");
  const [relatedPartId, setRelatedPartId] = useState(item?.relatedPartId ?? NONE_VALUE);
  const [status, setStatus] = useState<InventoryItemStatus>(item?.status ?? "in_stock");

  useEffect(() => {
    if (state.success) {
      toast.success(mode === "create" ? "재고 항목을 생성했습니다." : "재고 항목을 수정했습니다.");
      onOpenChange(false);
    }
  }, [state.success, mode, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "재고 항목 생성" : `재고 항목 수정 · ${item?.itemCode}`}</SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "BOM Part 연결은 선택 사항입니다. 생성 후 수량 변경은 입출고/조정으로 처리해주세요."
              : "수량과 보관 위치는 여기서 바꿀 수 없습니다. 입출고/조정/이동을 이용해주세요."}
          </SheetDescription>
        </SheetHeader>

        <form action={formAction} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          {mode === "edit" && item ? <input type="hidden" name="id" value={item.id} /> : null}
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="relatedPartId" value={relatedPartId === NONE_VALUE ? "" : relatedPartId} />
          {mode === "edit" ? <input type="hidden" name="status" value={status} /> : null}
          {mode === "create" && prefill?.sourcePurchaseRequestId ? (
            <input type="hidden" name="sourcePurchaseRequestId" value={prefill.sourcePurchaseRequestId} />
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="itemCode">품목 코드</Label>
              <Input id="itemCode" name="itemCode" defaultValue={item?.itemCode ?? ""} placeholder="예: RM-001" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="itemName">품목명</Label>
              <Input id="itemName" name="itemName" defaultValue={item?.itemName ?? prefill?.itemName ?? ""} required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>카테고리</Label>
            <Select value={category} onValueChange={(value) => setCategory((value ?? "consumable") as InventoryCategory)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVENTORY_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {INVENTORY_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="manufacturer">제조사</Label>
              <Input id="manufacturer" name="manufacturer" defaultValue={item?.manufacturer ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="supplier">공급업체</Label>
              <Input id="supplier" name="supplier" defaultValue={item?.supplier ?? prefill?.supplier ?? ""} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">설명</Label>
            <Textarea id="description" name="description" defaultValue={item?.description ?? ""} rows={2} />
          </div>

          {mode === "create" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="currentQuantity">현재 수량</Label>
                <Input
                  id="currentQuantity"
                  name="currentQuantity"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={prefill?.currentQuantity ?? 0}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="minimumQuantity">최소 수량</Label>
                <Input id="minimumQuantity" name="minimumQuantity" type="number" min={0} step="0.01" defaultValue={item?.minimumQuantity ?? 0} required />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="minimumQuantity">최소 수량</Label>
              <Input id="minimumQuantity" name="minimumQuantity" type="number" min={0} step="0.01" defaultValue={item?.minimumQuantity ?? 0} required />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="unit">단위</Label>
              <Input id="unit" name="unit" defaultValue={item?.unit ?? "ea"} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="unitCost">단가 (원)</Label>
              <Input id="unitCost" name="unitCost" type="number" min={0} step={100} defaultValue={item?.unitCost ?? prefill?.unitCost ?? ""} />
            </div>
          </div>

          {mode === "create" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="storageLocation">보관 위치</Label>
              <Input id="storageLocation" name="storageLocation" placeholder="예: 창고 A-3" />
            </div>
          ) : null}

          {mode === "edit" ? (
            <div className="flex flex-col gap-2">
              <Label>상태</Label>
              <Select value={status} onValueChange={(value) => setStatus((value ?? "in_stock") as InventoryItemStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVENTORY_ITEM_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {INVENTORY_ITEM_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label>연결된 BOM Part (선택)</Label>
            <Select value={relatedPartId} onValueChange={(value) => setRelatedPartId(value ?? NONE_VALUE)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>미지정</SelectItem>
                {partOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.partNumber} · {option.partName}
                    {option.category ? ` (${BOM_CATEGORY_LABELS[option.category]})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="owningDepartment">소속 부서 (선택, 공용 재고 지정용)</Label>
            <Input id="owningDepartment" name="owningDepartment" defaultValue={item?.owningDepartment ?? ""} placeholder="예: 기계팀" />
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {pending ? "저장 중..." : "저장"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
