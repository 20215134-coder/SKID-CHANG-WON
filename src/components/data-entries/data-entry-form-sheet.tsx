"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { createDataEntry, updateDataEntry, type DataEntryActionState } from "@/features/data-entries/actions";
import { DOCUMENT_FILE_ACCEPT } from "@/lib/general-documents/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { DataEntry } from "@/services/data-entry-service";
import type { Vehicle } from "@/services/vehicle-service";

const initialState: DataEntryActionState = {};
const NONE_VALUE = "none";

export function DataEntryFormSheet({
  mode,
  entry,
  categories,
  vehicles,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  entry?: DataEntry;
  categories: string[];
  vehicles: Vehicle[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const action = mode === "create" ? createDataEntry : updateDataEntry;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [relatedVehicleId, setRelatedVehicleId] = useState(entry?.relatedVehicleId ?? NONE_VALUE);

  useEffect(() => {
    if (state.success) {
      toast.success(mode === "create" ? "데이터를 등록했습니다." : "데이터를 수정했습니다.");
      onOpenChange(false);
    }
  }, [state.success, mode, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "데이터 등록" : `데이터 수정 · ${entry?.title}`}</SheetTitle>
        </SheetHeader>

        <form action={formAction} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          {mode === "edit" && entry ? <input type="hidden" name="id" value={entry.id} /> : null}
          <input type="hidden" name="relatedVehicleId" value={relatedVehicleId === NONE_VALUE ? "" : relatedVehicleId} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="category">카테고리</Label>
            <Input
              id="category"
              name="category"
              list="data-category-options"
              defaultValue={entry?.category ?? ""}
              placeholder="예: Engine Data"
              required
            />
            <datalist id="data-category-options">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">제목</Label>
            <Input id="title" name="title" defaultValue={entry?.title ?? ""} placeholder="예: 2026 Powertrain Motor" required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">내용 (선택)</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={entry?.description ?? ""}
              placeholder="문단을 나누어 자유롭게 작성하세요."
              rows={14}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>관련 차량 (선택)</Label>
            <Select value={relatedVehicleId} onValueChange={(value) => setRelatedVehicleId(value ?? NONE_VALUE)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>미지정</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="attachments">첨부 파일 (선택)</Label>
            <Input id="attachments" name="attachments" type="file" accept={DOCUMENT_FILE_ACCEPT} multiple />
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
