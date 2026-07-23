"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataEntryFormSheet } from "@/components/data-entries/data-entry-form-sheet";
import type { DataEntry } from "@/services/data-entry-service";
import type { Vehicle } from "@/services/vehicle-service";

export function EditDataEntryButton({ entry, categories, vehicles }: { entry: DataEntry; categories: string[]; vehicles: Vehicle[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil />
        수정
      </Button>
      <DataEntryFormSheet mode="edit" entry={entry} categories={categories} vehicles={vehicles} open={open} onOpenChange={setOpen} />
    </>
  );
}
