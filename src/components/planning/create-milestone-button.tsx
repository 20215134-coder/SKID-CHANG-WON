"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MilestoneFormSheet } from "@/components/planning/milestone-form-sheet";

export function CreateMilestoneButton({ annualPlanId }: { annualPlanId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        마일스톤 생성
      </Button>
      <MilestoneFormSheet mode="create" annualPlanId={annualPlanId} open={open} onOpenChange={setOpen} />
    </>
  );
}
