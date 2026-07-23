"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  createPurchaseRequest,
  fetchAssembliesForSubsystem,
  fetchCategoriesForVehicle,
  fetchPartOptionsForAssembly,
  fetchSubsystemsForCategory,
  fetchVehicleOptions,
  updatePurchaseRequest,
  type PurchaseActionState,
} from "@/features/purchasing/actions";
import { BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { PURCHASE_FILE_ACCEPT, PURCHASE_PRIORITIES, PURCHASE_PRIORITY_LABELS } from "@/lib/purchasing/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { Assembly } from "@/services/assembly-service";
import type { PartOption } from "@/services/bom-service";
import type { PurchaseRequest } from "@/services/purchase-service";
import type { Subsystem } from "@/services/subsystem-service";
import type { EngineeringCategory, Vehicle } from "@/services/vehicle-service";
import type { PurchasePriority } from "@/types/database.types";

const initialState: PurchaseActionState = {};
const NONE_VALUE = "none";

export function PurchaseRequestFormSheet({
  mode,
  request,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  request?: PurchaseRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const action = mode === "create" ? createPurchaseRequest : updatePurchaseRequest;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [vehicleId, setVehicleId] = useState(request?.vehicleId ?? "");
  const [categoryId, setCategoryId] = useState(request?.categoryId ?? "");
  const [subsystemId, setSubsystemId] = useState(request?.subsystemId ?? NONE_VALUE);
  const [assemblyId, setAssemblyId] = useState(request?.assemblyId ?? NONE_VALUE);
  const [partId, setPartId] = useState(request?.partId ?? NONE_VALUE);
  const [priority, setPriority] = useState<PurchasePriority>(request?.priority ?? "normal");

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<EngineeringCategory[]>([]);
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [parts, setParts] = useState<PartOption[]>([]);

  useEffect(() => {
    if (state.success) {
      toast.success(mode === "create" ? "구매 요청을 저장했습니다." : "구매 요청을 수정했습니다.");
      onOpenChange(false);
    }
  }, [state.success, mode, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    fetchVehicleOptions().then(setVehicles);
  }, [open]);

  useEffect(() => {
    if (!vehicleId) return;
    fetchCategoriesForVehicle(vehicleId).then(setCategories);
  }, [vehicleId]);

  useEffect(() => {
    if (!categoryId) return;
    fetchSubsystemsForCategory(categoryId).then(setSubsystems);
  }, [categoryId]);

  useEffect(() => {
    if (!subsystemId || subsystemId === NONE_VALUE) return;
    fetchAssembliesForSubsystem(subsystemId).then(setAssemblies);
  }, [subsystemId]);

  useEffect(() => {
    if (assemblyId === NONE_VALUE) return;
    fetchPartOptionsForAssembly(assemblyId).then(setParts);
  }, [assemblyId]);

  function handleVehicleChange(value: string) {
    setVehicleId(value);
    setCategoryId("");
    setSubsystemId(NONE_VALUE);
    setAssemblyId(NONE_VALUE);
    setPartId(NONE_VALUE);
  }

  function handleCategoryChange(value: string) {
    setCategoryId(value);
    setSubsystemId(NONE_VALUE);
    setAssemblyId(NONE_VALUE);
    setPartId(NONE_VALUE);
  }

  function handleSubsystemChange(value: string | null) {
    setSubsystemId(value ?? NONE_VALUE);
    setAssemblyId(NONE_VALUE);
    setPartId(NONE_VALUE);
  }

  function handleAssemblyChange(value: string | null) {
    setAssemblyId(value ?? NONE_VALUE);
    setPartId(NONE_VALUE);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "구매 요청 작성" : `구매 요청 수정 · ${request?.requestNumber}`}</SheetTitle>
          <SheetDescription>임시 저장하면 나중에 이어서 작성할 수 있고, 제출하면 승인 대기 상태가 됩니다.</SheetDescription>
        </SheetHeader>

        <form action={formAction} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          {mode === "edit" && request ? <input type="hidden" name="id" value={request.id} /> : null}
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="subsystemId" value={subsystemId === NONE_VALUE ? "" : subsystemId} />
          <input type="hidden" name="assemblyId" value={assemblyId === NONE_VALUE ? "" : assemblyId} />
          <input type="hidden" name="partId" value={partId === NONE_VALUE ? "" : partId} />
          <input type="hidden" name="priority" value={priority} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">제목</Label>
            <Input id="title" name="title" defaultValue={request?.title ?? ""} required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">설명</Label>
            <Textarea id="description" name="description" defaultValue={request?.description ?? ""} rows={2} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Vehicle</Label>
            <Select value={vehicleId} onValueChange={(value) => handleVehicleChange(value ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="차량 선택" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Engineering Category</Label>
            <Select value={categoryId} onValueChange={(value) => handleCategoryChange(value ?? "")} disabled={!vehicleId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {BOM_CATEGORY_LABELS[category.name]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Subsystem (선택)</Label>
            <Select value={subsystemId} onValueChange={handleSubsystemChange} disabled={!categoryId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Subsystem 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>미지정</SelectItem>
                {subsystems.map((subsystem) => (
                  <SelectItem key={subsystem.id} value={subsystem.id}>
                    {subsystem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Assembly (선택)</Label>
            <Select value={assemblyId} onValueChange={handleAssemblyChange} disabled={subsystemId === NONE_VALUE}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>미지정</SelectItem>
                {assemblies.map((assembly) => (
                  <SelectItem key={assembly.id} value={assembly.id}>
                    {assembly.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>관련 Part (선택)</Label>
            <Select value={partId} onValueChange={(value) => setPartId(value ?? NONE_VALUE)} disabled={assemblyId === NONE_VALUE}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>미지정</SelectItem>
                {parts.map((part) => (
                  <SelectItem key={part.id} value={part.id}>
                    {part.partNumber} · {part.partName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input id="supplier" name="supplier" defaultValue={request?.supplier ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">수량</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                step={1}
                defaultValue={request?.quantity ?? 1}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="productUrl">제품 URL</Label>
            <Input id="productUrl" name="productUrl" type="url" defaultValue={request?.productUrl ?? ""} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="estimatedCost">예상 비용 (원)</Label>
              <Input
                id="estimatedCost"
                name="estimatedCost"
                type="number"
                min={0}
                step={100}
                defaultValue={request?.estimatedCost ?? ""}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as PurchasePriority)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PURCHASE_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PURCHASE_PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {mode === "create" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="attachments">첨부 파일 (선택, PDF/PNG/JPG)</Label>
              <Input id="attachments" name="attachments" type="file" accept={PURCHASE_FILE_ACCEPT} multiple />
            </div>
          ) : null}

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <SheetFooter className="flex-row gap-2 px-0">
            <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending} className="flex-1">
              {pending ? "저장 중..." : "임시 저장"}
            </Button>
            <Button type="submit" name="intent" value="submit" disabled={pending} className="flex-1">
              {pending ? "제출 중..." : "제출"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
