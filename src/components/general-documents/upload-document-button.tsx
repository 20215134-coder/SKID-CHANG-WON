"use client";

import { useActionState, useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { uploadGeneralDocument, type GeneralDocumentActionState } from "@/features/general-documents/actions";
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS, DOCUMENT_FILE_ACCEPT } from "@/lib/general-documents/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DocumentCategory } from "@/types/database.types";

const initialState: GeneralDocumentActionState = {};

export function UploadDocumentButton() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<DocumentCategory>("other");
  const [state, formAction, pending] = useActionState(uploadGeneralDocument, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("문서를 업로드했습니다.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 액션 완료(외부 이벤트)에 반응해 다이얼로그를 닫는다.
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Upload />
        문서 업로드
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>문서 업로드</DialogTitle>
            <DialogDescription>규정, 설계 보고서 등 팀 공용 문서를 업로드합니다.</DialogDescription>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="category" value={category} />

            <div className="flex flex-col gap-2">
              <Label>분류</Label>
              <Select value={category} onValueChange={(value) => setCategory((value ?? "other") as DocumentCategory)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {DOCUMENT_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="title">제목</Label>
              <Input id="title" name="title" placeholder="예: 2026 Design Report" required />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">설명 (선택)</Label>
              <Textarea id="description" name="description" rows={2} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="file">파일 선택</Label>
              <Input id="file" name="file" type="file" accept={DOCUMENT_FILE_ACCEPT} required />
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
