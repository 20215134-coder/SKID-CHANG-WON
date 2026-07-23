"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { createAsset, updateAsset, type AssetActionState } from "@/features/assets/actions";
import { ASSET_CONDITIONS, ASSET_CONDITION_LABELS } from "@/lib/assets/constants";
import { BOM_CATEGORIES, BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { Asset } from "@/services/asset-service";
import type { MemberOption } from "@/services/team-service";
import type { AssetCondition, BomCategory } from "@/types/database.types";

const initialState: AssetActionState = {};
const NONE_VALUE = "none";

export interface AssetFormPrefill {
  assetName?: string;
  purchaseCost?: number;
  engineeringCategory?: BomCategory;
  sourcePurchaseRequestId?: string;
}

export function AssetFormSheet({
  mode,
  asset,
  memberOptions,
  prefill,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  asset?: Asset;
  memberOptions: MemberOption[];
  prefill?: AssetFormPrefill;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const action = mode === "create" ? createAsset : updateAsset;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [condition, setCondition] = useState<AssetCondition>(asset?.currentCondition ?? "good");
  const [assignedTo, setAssignedTo] = useState(asset?.assignedToId ?? NONE_VALUE);
  const [engineeringCategory, setEngineeringCategory] = useState(
    asset?.engineeringCategory ?? prefill?.engineeringCategory ?? NONE_VALUE,
  );

  useEffect(() => {
    if (state.success) {
      toast.success(mode === "create" ? "자산을 등록했습니다." : "자산 정보를 저장했습니다.");
      onOpenChange(false);
    }
  }, [state.success, mode, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "자산 등록" : `자산 수정 · ${asset?.assetName}`}</SheetTitle>
        </SheetHeader>

        <form action={formAction} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          {mode === "edit" && asset ? <input type="hidden" name="id" value={asset.id} /> : null}
          <input type="hidden" name="currentCondition" value={condition} />
          <input type="hidden" name="assignedTo" value={assignedTo === NONE_VALUE ? "" : assignedTo} />
          <input type="hidden" name="engineeringCategory" value={engineeringCategory === NONE_VALUE ? "" : engineeringCategory} />
          {mode === "create" && prefill?.sourcePurchaseRequestId ? (
            <input type="hidden" name="sourcePurchaseRequestId" value={prefill.sourcePurchaseRequestId} />
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="assetName">자산 이름</Label>
            <Input id="assetName" name="assetName" defaultValue={asset?.assetName ?? prefill?.assetName ?? ""} placeholder="예: Torque Wrench" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="assetNumber">자산 번호</Label>
              <Input id="assetNumber" name="assetNumber" defaultValue={asset?.assetNumber ?? ""} placeholder="예: AST-001" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Engineering Category (선택)</Label>
              <Select value={engineeringCategory} onValueChange={(value) => setEngineeringCategory((value ?? NONE_VALUE) as BomCategory | "none")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>미지정 (공용)</SelectItem>
                  {BOM_CATEGORIES.filter((category) => category !== "common").map((category) => (
                    <SelectItem key={category} value={category}>
                      {BOM_CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">설명 (선택)</Label>
            <Textarea id="description" name="description" defaultValue={asset?.description ?? ""} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="purchaseDate">구매일</Label>
              <Input id="purchaseDate" name="purchaseDate" type="date" defaultValue={asset?.purchaseDate ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="purchaseCost">구매 비용 (원)</Label>
              <Input
                id="purchaseCost"
                name="purchaseCost"
                type="number"
                min={0}
                step={100}
                defaultValue={asset?.purchaseCost ?? prefill?.purchaseCost ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>상태</Label>
            <Select value={condition} onValueChange={(value) => setCondition((value ?? "good") as AssetCondition)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_CONDITIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {ASSET_CONDITION_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>담당자 (선택)</Label>
            <Select value={assignedTo} onValueChange={(value) => setAssignedTo(value ?? NONE_VALUE)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>미지정</SelectItem>
                {memberOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">비고</Label>
            <Textarea id="notes" name="notes" defaultValue={asset?.notes ?? ""} rows={2} />
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
