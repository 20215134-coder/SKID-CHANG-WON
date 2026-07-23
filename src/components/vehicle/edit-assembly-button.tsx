"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { updateAssembly, type VehicleActionState } from "@/features/vehicle/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Assembly } from "@/services/assembly-service";

const initialState: VehicleActionState = {};

export function EditAssemblyButton({ assembly }: { assembly: Assembly }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateAssembly, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Assembly 정보를 저장했습니다.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 액션 완료(외부 이벤트)에 반응해 다이얼로그를 닫는다.
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil />
        수정
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assembly 수정</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={assembly.id} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" name="name" defaultValue={assembly.name} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="revision">Revision</Label>
              <Input id="revision" name="revision" defaultValue={assembly.revision} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">설명</Label>
              <Textarea id="description" name="description" defaultValue={assembly.description ?? ""} rows={2} />
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
