"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataEntryFormSheet } from "@/components/data-entries/data-entry-form-sheet";
import type { Vehicle } from "@/services/vehicle-service";

export function CreateDataEntryButton({ categories, vehicles }: { categories: string[]; vehicles: Vehicle[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        데이터 등록
      </Button>
      <DataEntryFormSheet mode="create" categories={categories} vehicles={vehicles} open={open} onOpenChange={setOpen} />
    </>
  );
}
