"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InventoryFormSheet } from "@/components/inventory/inventory-form-sheet";
import type { BomPartOption } from "@/services/bom-service";

export function CreateInventoryButton({ partOptions }: { partOptions: BomPartOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        재고 항목 생성
      </Button>
      <InventoryFormSheet mode="create" partOptions={partOptions} open={open} onOpenChange={setOpen} />
    </>
  );
}
