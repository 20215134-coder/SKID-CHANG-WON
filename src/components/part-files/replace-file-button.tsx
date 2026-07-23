"use client";

import { useActionState, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { replacePartFile, type PartFileActionState } from "@/features/part-files/actions";
import { PART_FILE_ACCEPT } from "@/lib/part-files/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: PartFileActionState = {};

export function ReplaceFileButton({ fileId, fileName }: { fileId: string; fileName: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(replacePartFile, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("새 버전으로 교체했습니다.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 액션 완료(외부 이벤트)에 반응해 다이얼로그를 닫는다.
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => setOpen(true)}
        title={`${fileName} 새 버전으로 교체`}
        aria-label={`${fileName} 새 버전으로 교체`}
      >
        <RefreshCw className="size-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 버전으로 교체</DialogTitle>
            <DialogDescription>{fileName}을(를) 새 버전으로 교체합니다. 이전 버전은 이력에 남습니다.</DialogDescription>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="fileId" value={fileId} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="file">새 파일 선택</Label>
              <Input id="file" name="file" type="file" accept={PART_FILE_ACCEPT} required />
            </div>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "교체 중..." : "교체"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
