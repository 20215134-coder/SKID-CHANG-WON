"use client";

import { type FormEvent, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MANUFACTURING_STATUSES, MANUFACTURING_STATUS_LABELS } from "@/lib/bom/constants";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "updated_at:desc", label: "최근 수정순" },
  { value: "updated_at:asc", label: "오래된 수정순" },
  { value: "part_name:asc", label: "이름 오름차순" },
  { value: "part_name:desc", label: "이름 내림차순" },
  { value: "revision:asc", label: "Revision 오름차순" },
  { value: "revision:desc", label: "Revision 내림차순" },
];

export function PartFilters() {
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

  const currentSort = `${searchParams.get("sortField") ?? "updated_at"}:${searchParams.get("sortDirection") ?? "desc"}`;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Part Number 또는 Part Name 검색"
          className="w-64"
        />
        <Button type="submit" variant="outline" size="icon" aria-label="검색">
          <Search />
        </Button>
      </form>

      <Select
        defaultValue={searchParams.get("status") ?? "all"}
        onValueChange={(value) => updateParam("status", value)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="제작 상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 상태</SelectItem>
          {MANUFACTURING_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {MANUFACTURING_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentSort}
        onValueChange={(value) => {
          const [field, direction] = (value ?? "updated_at:desc").split(":");
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
