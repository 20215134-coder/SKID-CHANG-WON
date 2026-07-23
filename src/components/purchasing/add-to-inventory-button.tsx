"use client";

import { useState } from "react";
import { Boxes } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InventoryFormSheet } from "@/components/inventory/inventory-form-sheet";
import type { BomPartOption } from "@/services/bom-service";
import type { PurchaseRequest } from "@/services/purchase-service";

export function AddToInventoryButton({ request, partOptions }: { request: PurchaseRequest; partOptions: BomPartOption[] }) {
  const [open, setOpen] = useState(false);

  // finalCost/estimatedCost는 수량 전체에 대한 총 비용이므로, 재고의 단가로 넘기려면 수량으로 나눠야 한다.
  const totalCost = request.finalCost ?? request.estimatedCost;
  const unitCost = request.quantity > 0 ? Math.round(totalCost / request.quantity) : totalCost;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Boxes />
        재고에 추가
      </Button>
      <InventoryFormSheet
        mode="create"
        partOptions={partOptions}
        prefill={{
          itemName: request.title,
          supplier: request.supplier ?? undefined,
          currentQuantity: request.quantity,
          unitCost,
          sourcePurchaseRequestId: request.id,
        }}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
