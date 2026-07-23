"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { updateAnnouncement, type AnnouncementActionState } from "@/features/announcements/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Announcement } from "@/services/announcement-service";

const initialState: AnnouncementActionState = {};

export function EditAnnouncementButton({ announcement }: { announcement: Announcement }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateAnnouncement, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("공지를 수정했습니다.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 액션 완료(외부 이벤트)에 반응해 다이얼로그를 닫는다.
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <Button variant="ghost" size="icon" className="size-8" onClick={() => setOpen(true)} aria-label="수정">
        <Pencil className="size-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공지 수정</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={announcement.id} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">제목</Label>
              <Input id="title" name="title" defaultValue={announcement.title} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="content">내용</Label>
              <Textarea id="content" name="content" defaultValue={announcement.content} rows={6} required />
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
