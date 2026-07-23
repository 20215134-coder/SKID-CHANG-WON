"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AssetFormSheet } from "@/components/assets/asset-form-sheet";
import type { MemberOption } from "@/services/team-service";
import type { PurchaseRequest } from "@/services/purchase-service";

export function RegisterAsAssetButton({ request, memberOptions }: { request: PurchaseRequest; memberOptions: MemberOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Wrench />
        자산으로 등록
      </Button>
      <AssetFormSheet
        mode="create"
        memberOptions={memberOptions}
        prefill={{
          assetName: request.title,
          purchaseCost: request.finalCost ?? request.estimatedCost,
          engineeringCategory: request.categoryName,
          sourcePurchaseRequestId: request.id,
        }}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
