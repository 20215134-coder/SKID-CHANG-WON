"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AssetFormSheet } from "@/components/assets/asset-form-sheet";
import type { MemberOption } from "@/services/team-service";

export function CreateAssetButton({ memberOptions }: { memberOptions: MemberOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        자산 등록
      </Button>
      <AssetFormSheet mode="create" memberOptions={memberOptions} open={open} onOpenChange={setOpen} />
    </>
  );
}
