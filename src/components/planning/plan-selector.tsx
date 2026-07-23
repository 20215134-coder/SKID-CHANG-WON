"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AnnualPlan } from "@/services/annual-plan-service";

export function PlanSelector({ plans, currentPlanId }: { plans: AnnualPlan[]; currentPlanId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (plans.length <= 1) return null;

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("planId", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={currentPlanId} onValueChange={handleChange}>
      <SelectTrigger className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {plans.map((plan) => (
          <SelectItem key={plan.id} value={plan.id}>
            {plan.season} · {plan.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
