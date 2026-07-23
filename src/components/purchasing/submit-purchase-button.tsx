"use client";

import { useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { submitPurchaseRequest } from "@/features/purchasing/actions";
import { Button } from "@/components/ui/button";

export function SubmitPurchaseButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitPurchaseRequest(id);
      if (result.error) toast.error(result.error);
      else toast.success("제출했습니다.");
    });
  }

  return (
    <Button onClick={handleSubmit} disabled={pending}>
      <Send />
      제출
    </Button>
  );
}
