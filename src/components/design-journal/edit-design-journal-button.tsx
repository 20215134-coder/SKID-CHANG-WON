"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DesignJournalFormSheet } from "@/components/design-journal/design-journal-form-sheet";
import type { DesignJournal } from "@/services/design-journal-service";

export function EditDesignJournalButton({ journal }: { journal: DesignJournal }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil />
        수정
      </Button>
      <DesignJournalFormSheet mode="edit" journal={journal} open={open} onOpenChange={setOpen} />
    </>
  );
}
