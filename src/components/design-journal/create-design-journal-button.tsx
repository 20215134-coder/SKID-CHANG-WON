"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DesignJournalFormSheet } from "@/components/design-journal/design-journal-form-sheet";

export function CreateDesignJournalButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        새 게시글 작성
      </Button>
      <DesignJournalFormSheet mode="create" open={open} onOpenChange={setOpen} />
    </>
  );
}
