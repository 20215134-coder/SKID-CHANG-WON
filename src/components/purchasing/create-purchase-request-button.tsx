"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PurchaseRequestFormSheet } from "@/components/purchasing/purchase-request-form-sheet";

export function CreatePurchaseRequestButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        구매 요청 작성
      </Button>
      <PurchaseRequestFormSheet mode="create" open={open} onOpenChange={setOpen} />
    </>
  );
}
