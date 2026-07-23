"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { approvePurchaseRequest } from "@/features/purchasing/actions";
import { Button } from "@/components/ui/button";

export function ApproveButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const result = await approvePurchaseRequest(id);
      if (result.error) toast.error(result.error);
      else toast.success("승인했습니다.");
    });
  }

  return (
    <Button onClick={handleApprove} disabled={pending}>
      <Check />
      승인
    </Button>
  );
}
