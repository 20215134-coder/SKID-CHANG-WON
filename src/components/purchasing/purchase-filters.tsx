"use client";

import { type FormEvent, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { PURCHASE_PRIORITIES, PURCHASE_PRIORITY_LABELS, PURCHASE_STATUS_LABELS } from "@/lib/purchasing/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PurchaseStatus } from "@/types/database.types";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "requested_at:desc", label: "최근 요청순" },
  { value: "requested_at:asc", label: "오래된 요청순" },
  { value: "estimated_cost:desc", label: "예상 비용 높은순" },
  { value: "estimated_cost:asc", label: "예상 비용 낮은순" },
];

export function PurchaseFilters({ statusOptions }: { statusOptions?: PurchaseStatus[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParam("search", search);
  }

  const currentSort = `${searchParams.get("sortField") ?? "requested_at"}:${searchParams.get("sortDirection") ?? "desc"}`;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="요청 번호 또는 제목 검색"
          className="w-64"
        />
        <Button type="submit" variant="outline" size="icon" aria-label="검색">
          <Search />
        </Button>
      </form>

      {statusOptions ? (
        <Select defaultValue={searchParams.get("status") ?? "all"} onValueChange={(value) => updateParam("status", value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {PURCHASE_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <Select
        defaultValue={searchParams.get("priority") ?? "all"}
        onValueChange={(value) => updateParam("priority", value)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="우선순위" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 우선순위</SelectItem>
          {PURCHASE_PRIORITIES.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {PURCHASE_PRIORITY_LABELS[priority]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentSort}
        onValueChange={(value) => {
          const [field, direction] = (value ?? "requested_at:desc").split(":");
          const params = new URLSearchParams(searchParams.toString());
          params.set("sortField", field);
          params.set("sortDirection", direction);
          params.delete("page");
          router.push(`${pathname}?${params.toString()}`);
        }}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="정렬" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
