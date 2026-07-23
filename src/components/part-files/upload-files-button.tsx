"use client";

import { useActionState, useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { uploadPartFiles, type PartFileActionState } from "@/features/part-files/actions";
import { PART_FILE_ACCEPT } from "@/lib/part-files/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: PartFileActionState = {};

export function UploadFilesButton({ partId }: { partId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(uploadPartFiles, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("파일을 업로드했습니다.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 액션 완료(외부 이벤트)에 반응해 다이얼로그를 닫는다.
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Upload />
        파일 업로드
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>엔지니어링 파일 업로드</DialogTitle>
            <DialogDescription>CAD, 도면(PDF), 이미지 파일을 여러 개 한 번에 업로드할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="partId" value={partId} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="files">파일 선택</Label>
              <Input id="files" name="files" type="file" accept={PART_FILE_ACCEPT} multiple required />
            </div>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "업로드 중..." : "업로드"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
