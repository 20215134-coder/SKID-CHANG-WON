"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkJournalFormSheet } from "@/components/work-journal/work-journal-form-sheet";

export function CreateWorkJournalButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        새 작업일지 작성
      </Button>
      <WorkJournalFormSheet mode="create" open={open} onOpenChange={setOpen} />
    </>
  );
}
