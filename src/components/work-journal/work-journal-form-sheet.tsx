"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  createWorkJournal,
  fetchActiveMembers,
  fetchConsumableItemOptions,
  updateWorkJournal,
  type WorkJournalActionState,
} from "@/features/work-journal/actions";
import {
  fetchAssembliesForSubsystem,
  fetchCategoriesForVehicle,
  fetchSubsystemsForCategory,
  fetchVehicleOptions,
} from "@/features/vehicle-hierarchy/actions";
import { BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { WORK_JOURNAL_FILE_ACCEPT } from "@/lib/work-journal/constants";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConsumablePicker, type ConsumableEntry } from "@/components/work-journal/consumable-picker";
import { ParticipantPicker } from "@/components/work-journal/participant-picker";
import type { Assembly } from "@/services/assembly-service";
import type { InventoryItemOption } from "@/services/inventory-service";
import type { Subsystem } from "@/services/subsystem-service";
import type { MemberOption } from "@/services/team-service";
import type { EngineeringCategory, Vehicle } from "@/services/vehicle-service";
import type { WorkJournal, WorkJournalParticipant } from "@/services/work-journal-service";
import type { BomCategory } from "@/types/database.types";

const initialState: WorkJournalActionState = {};
const NONE_VALUE = "none";

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function WorkJournalFormSheet({
  mode,
  journal,
  participants,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  journal?: WorkJournal;
  participants?: WorkJournalParticipant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const action = mode === "create" ? createWorkJournal : updateWorkJournal;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [vehicleId, setVehicleId] = useState(journal?.vehicleId ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [engineeringCategory, setEngineeringCategory] = useState<BomCategory | "">(journal?.engineeringCategory ?? "");
  const [subsystemId, setSubsystemId] = useState(journal?.subsystemId ?? NONE_VALUE);
  const [assemblyId, setAssemblyId] = useState(journal?.assemblyId ?? NONE_VALUE);
  const [participantIds, setParticipantIds] = useState<string[]>(participants?.map((p) => p.memberId) ?? []);
  const [consumables, setConsumables] = useState<ConsumableEntry[]>([]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<EngineeringCategory[]>([]);
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemOption[]>([]);

  useEffect(() => {
    if (state.success) {
      toast.success(mode === "create" ? "작업일지를 작성했습니다." : "작업일지를 수정했습니다.");
      onOpenChange(false);
    }
  }, [state.success, mode, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    fetchVehicleOptions().then(setVehicles);
    fetchActiveMembers().then(setMembers);
    if (mode === "create") fetchConsumableItemOptions().then(setInventoryItems);
  }, [open, mode]);

  useEffect(() => {
    if (!vehicleId) return;
    fetchCategoriesForVehicle(vehicleId).then((rows) => {
      setCategories(rows);
      const matched = rows.find((row) => row.name === engineeringCategory);
      if (matched) setCategoryId(matched.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 최초 로드시 기존 값과 매칭하기 위함, vehicleId 변경시에만 재조회
  }, [vehicleId]);

  useEffect(() => {
    if (!categoryId) return;
    fetchSubsystemsForCategory(categoryId).then(setSubsystems);
  }, [categoryId]);

  useEffect(() => {
    if (!subsystemId || subsystemId === NONE_VALUE) return;
    fetchAssembliesForSubsystem(subsystemId).then(setAssemblies);
  }, [subsystemId]);

  function handleVehicleChange(value: string) {
    setVehicleId(value);
    setCategoryId("");
    setEngineeringCategory("");
    setSubsystemId(NONE_VALUE);
    setAssemblyId(NONE_VALUE);
  }

  function handleCategoryChange(value: string) {
    const category = categories.find((row) => row.id === value);
    setCategoryId(value);
    setEngineeringCategory(category?.name ?? "");
    setSubsystemId(NONE_VALUE);
    setAssemblyId(NONE_VALUE);
  }

  function handleSubsystemChange(value: string | null) {
    setSubsystemId(value ?? NONE_VALUE);
    setAssemblyId(NONE_VALUE);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Work Journal 작성" : `Work Journal 수정 · ${journal?.title}`}</SheetTitle>
          <SheetDescription>제작/조립 작업 내역과 참여자, 소요 시간을 기록합니다.</SheetDescription>
        </SheetHeader>

        <form action={formAction} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          {mode === "edit" && journal ? <input type="hidden" name="id" value={journal.id} /> : null}
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <input type="hidden" name="engineeringCategory" value={engineeringCategory} />
          <input type="hidden" name="subsystemId" value={subsystemId === NONE_VALUE ? "" : subsystemId} />
          <input type="hidden" name="assemblyId" value={assemblyId === NONE_VALUE ? "" : assemblyId} />
          <input type="hidden" name="participantIds" value={JSON.stringify(participantIds)} />
          {mode === "create" ? <input type="hidden" name="consumables" value={JSON.stringify(consumables)} /> : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">제목</Label>
            <Input id="title" name="title" defaultValue={journal?.title ?? ""} required />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Vehicle Season</Label>
            <Select value={vehicleId} onValueChange={(value) => handleVehicleChange(value ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="차량 선택" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.competitionYear} · {vehicle.vehicleName}
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
                <SelectValue />
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
            <Select value={assemblyId} onValueChange={(value) => setAssemblyId(value ?? NONE_VALUE)} disabled={subsystemId === NONE_VALUE}>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="workStart">작업 시작</Label>
              <Input
                id="workStart"
                name="workStart"
                type="datetime-local"
                defaultValue={journal ? toDatetimeLocal(journal.workStart) : ""}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="workEnd">작업 종료</Label>
              <Input
                id="workEnd"
                name="workEnd"
                type="datetime-local"
                defaultValue={journal ? toDatetimeLocal(journal.workEnd) : ""}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>참여자</Label>
            <ParticipantPicker members={members} selectedIds={participantIds} onChange={setParticipantIds} />
          </div>

          {mode === "create" ? (
            <div className="flex flex-col gap-2">
              <Label>소모품 사용</Label>
              <ConsumablePicker items={inventoryItems} entries={consumables} onChange={setConsumables} />
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label>내용</Label>
            <RichTextEditor name="content" defaultValue={journal?.content} placeholder="작업 내용, 특이사항 등을 작성하세요." />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="attachments">첨부 파일 (선택, 사진/영상/CAD/도면/ZIP)</Label>
            <Input id="attachments" name="attachments" type="file" accept={WORK_JOURNAL_FILE_ACCEPT} multiple />
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {pending ? "저장 중..." : mode === "create" ? "작성" : "저장"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
