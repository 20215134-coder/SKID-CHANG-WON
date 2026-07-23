"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AnnualPlanFormSheet } from "@/components/planning/annual-plan-form-sheet";

export function CreateAnnualPlanButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        연간 계획 생성
      </Button>
      <AnnualPlanFormSheet mode="create" open={open} onOpenChange={setOpen} />
    </>
  );
}
