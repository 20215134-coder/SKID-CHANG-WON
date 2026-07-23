"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS } from "@/lib/general-documents/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DocumentFilters({ currentCategory }: { currentCategory: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete("category");
    else params.set("category", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={currentCategory} onValueChange={handleChange}>
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">전체 분류</SelectItem>
        {DOCUMENT_CATEGORIES.map((category) => (
          <SelectItem key={category} value={category}>
            {DOCUMENT_CATEGORY_LABELS[category]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
