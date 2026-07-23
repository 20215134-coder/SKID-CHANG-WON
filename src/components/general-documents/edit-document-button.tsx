"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { updateGeneralDocument, type GeneralDocumentActionState } from "@/features/general-documents/actions";
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS } from "@/lib/general-documents/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { GeneralDocument } from "@/services/general-document-service";
import type { DocumentCategory } from "@/types/database.types";

const initialState: GeneralDocumentActionState = {};

export function EditDocumentButton({ document }: { document: GeneralDocument }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<DocumentCategory>(document.category);
  const [state, formAction, pending] = useActionState(updateGeneralDocument, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("문서 정보를 저장했습니다.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버 액션 완료(외부 이벤트)에 반응해 다이얼로그를 닫는다.
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => setOpen(true)} aria-label="수정">
        <Pencil className="size-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>문서 정보 수정 · {document.title}</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={document.id} />
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
              <Input id="title" name="title" defaultValue={document.title} required />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">설명 (선택)</Label>
              <Textarea id="description" name="description" defaultValue={document.description ?? ""} rows={2} />
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
