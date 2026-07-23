"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { PartFormSheet } from "@/components/bom/part-form-sheet";
import { Button } from "@/components/ui/button";
import type { AssetOption } from "@/services/asset-service";
import type { InventoryItemOption } from "@/services/inventory-service";
import type { MemberOption } from "@/services/team-service";

export function CreatePartButton({
  assemblyId,
  memberOptions,
  itemOptions,
  assetOptions,
}: {
  assemblyId: string;
  memberOptions: MemberOption[];
  itemOptions: InventoryItemOption[];
  assetOptions: AssetOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        부품 생성
      </Button>
      <PartFormSheet
        mode="create"
        assemblyId={assemblyId}
        open={open}
        onOpenChange={setOpen}
        memberOptions={memberOptions}
        itemOptions={itemOptions}
        assetOptions={assetOptions}
      />
    </>
  );
}
