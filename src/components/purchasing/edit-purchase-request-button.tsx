"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PurchaseRequestFormSheet } from "@/components/purchasing/purchase-request-form-sheet";
import type { PurchaseRequest } from "@/services/purchase-service";

export function EditPurchaseRequestButton({ request }: { request: PurchaseRequest }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil />
        수정
      </Button>
      <PurchaseRequestFormSheet mode="edit" request={request} open={open} onOpenChange={setOpen} />
    </>
  );
}
