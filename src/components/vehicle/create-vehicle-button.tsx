"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createVehicle, type VehicleActionState } from "@/features/vehicle/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: VehicleActionState = {};

export function CreateVehicleButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createVehicle, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("차량을 생성했습니다.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 액션 완료(외부 이벤트)에 반응해 다이얼로그를 닫는다.
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        차량 생성
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 차량(시즌) 생성</DialogTitle>
            <DialogDescription>생성하면 Chassis/Powertrain/Aero/Electrical 4개 카테고리가 자동으로 만들어집니다.</DialogDescription>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="vehicleName">차량 이름</Label>
              <Input id="vehicleName" name="vehicleName" placeholder="예: 2027 Car" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="competitionYear">대회 연도</Label>
              <Input id="competitionYear" name="competitionYear" type="number" defaultValue={2027} required />
            </div>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "생성 중..." : "생성"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
