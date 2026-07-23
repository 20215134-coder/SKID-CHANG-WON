"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { createPart, fetchPartRevisions, updatePart, type BomActionState } from "@/features/bom/actions";
import { MANUFACTURING_STATUSES, MANUFACTURING_STATUS_LABELS } from "@/lib/bom/constants";
import { RevisionTimeline } from "@/components/bom/revision-timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { AssetOption } from "@/services/asset-service";
import type { InventoryItemOption } from "@/services/inventory-service";
import type { MemberOption } from "@/services/team-service";
import type { BomPart, BomPartRevision } from "@/services/bom-service";
import type { ManufacturingStatus } from "@/types/database.types";

const initialState: BomActionState = {};
const NONE_VALUE = "none";

function materialSourceValue(part?: BomPart): string {
  if (part?.inventoryItemId) return `inv:${part.inventoryItemId}`;
  if (part?.assetId) return `asset:${part.assetId}`;
  return NONE_VALUE;
}

export function PartFormSheet({
  mode,
  assemblyId,
  part,
  open,
  onOpenChange,
  memberOptions,
  itemOptions,
  assetOptions,
}: {
  mode: "create" | "edit";
  assemblyId: string;
  part?: BomPart;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberOptions: MemberOption[];
  itemOptions: InventoryItemOption[];
  assetOptions: AssetOption[];
}) {
  const action = mode === "create" ? createPart : updatePart;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [status, setStatus] = useState<ManufacturingStatus>(part?.manufacturingStatus ?? "designing");
  const [ownerId, setOwnerId] = useState(part?.ownerId ?? "none");
  const [materialSource, setMaterialSource] = useState(materialSourceValue(part));
  const [revisions, setRevisions] = useState<BomPartRevision[]>([]);

  const inventoryItemId = materialSource.startsWith("inv:") ? materialSource.slice(4) : "";
  const assetId = materialSource.startsWith("asset:") ? materialSource.slice(6) : "";

  useEffect(() => {
    if (state.success) {
      toast.success(mode === "create" ? "부품을 생성했습니다." : "부품 정보를 저장했습니다.");
      onOpenChange(false);
    }
  }, [state.success, mode, onOpenChange]);

  useEffect(() => {
    if (open && mode === "edit" && part) {
      fetchPartRevisions(part.id).then(setRevisions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, part?.id]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "부품 생성" : `부품 수정 · ${part?.partNumber}`}</SheetTitle>
          <SheetDescription>
            {mode === "create" ? "새로운 BOM 부품을 등록합니다." : "Revision을 변경하면 이전 리비전이 이력에 저장됩니다."}
          </SheetDescription>
        </SheetHeader>

        <form action={formAction} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          {mode === "edit" && part ? <input type="hidden" name="id" value={part.id} /> : null}
          <input type="hidden" name="assemblyId" value={assemblyId} />
          <input type="hidden" name="manufacturingStatus" value={status} />
          <input type="hidden" name="ownerId" value={ownerId === "none" ? "" : ownerId} />
          <input type="hidden" name="inventoryItemId" value={inventoryItemId} />
          <input type="hidden" name="assetId" value={assetId} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="partNumber">Part Number</Label>
            <Input
              id="partNumber"
              name="partNumber"
              defaultValue={part?.partNumber ?? ""}
              placeholder="예: CHS-0012"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="partName">Part Name</Label>
            <Input id="partName" name="partName" defaultValue={part?.partName ?? ""} required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="revision">Revision</Label>
            <Input id="revision" name="revision" defaultValue={part?.revision ?? "A"} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="material">Material</Label>
              <Input id="material" name="material" defaultValue={part?.material ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="weight">Weight (g)</Label>
              <Input id="weight" name="weight" type="number" min={0} step="0.1" defaultValue={part?.weight ?? ""} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Manufacturing Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as ManufacturingStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MANUFACTURING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {MANUFACTURING_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Owner</Label>
            <Select value={ownerId} onValueChange={(value) => setOwnerId(value ?? "none")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">미지정</SelectItem>
                {memberOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input id="supplier" name="supplier" defaultValue={part?.supplier ?? ""} />
          </div>

          <div className="flex flex-col gap-2 border-t pt-4">
            <Label>연결된 자재 출처 (Consumable Inventory 또는 Assets, 자재비 계산용, 선택)</Label>
            <Select value={materialSource} onValueChange={(value) => setMaterialSource(value ?? NONE_VALUE)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>미지정</SelectItem>
                <SelectGroup>
                  <SelectLabel>Consumable Inventory</SelectLabel>
                  {itemOptions.map((option) => (
                    <SelectItem key={option.id} value={`inv:${option.id}`}>
                      {option.itemCode} · {option.itemName}
                      {option.unitCost !== null ? ` (개당 ${option.unitCost.toLocaleString("ko-KR")}원)` : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Assets</SelectLabel>
                  {assetOptions.map((option) => (
                    <SelectItem key={option.id} value={`asset:${option.id}`}>
                      {option.assetNumber} · {option.assetName}
                      {option.purchaseCost !== null ? ` (${option.purchaseCost.toLocaleString("ko-KR")}원)` : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {materialSource !== NONE_VALUE ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="materialQuantity">소요 수량</Label>
              <Input
                id="materialQuantity"
                name="materialQuantity"
                type="number"
                min={0.01}
                step="0.01"
                defaultValue={part?.materialQuantity ?? 1}
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={part?.description ?? ""} rows={3} />
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          {mode === "edit" ? (
            <div className="flex flex-col gap-2 border-t pt-4">
              <Label>Revision 이력</Label>
              <RevisionTimeline revisions={revisions} />
            </div>
          ) : null}

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
