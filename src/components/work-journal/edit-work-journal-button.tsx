"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkJournalFormSheet } from "@/components/work-journal/work-journal-form-sheet";
import type { WorkJournal, WorkJournalConsumable, WorkJournalParticipant } from "@/services/work-journal-service";

export function EditWorkJournalButton({
  journal,
  participants,
  consumables,
}: {
  journal: WorkJournal;
  participants: WorkJournalParticipant[];
  consumables: WorkJournalConsumable[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil />
        수정
      </Button>
      <WorkJournalFormSheet
        mode="edit"
        journal={journal}
        participants={participants}
        consumables={consumables}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
