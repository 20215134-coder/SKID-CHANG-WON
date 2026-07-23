"use client";

import { type FormEvent, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { ASSET_CONDITIONS, ASSET_CONDITION_LABELS } from "@/lib/assets/constants";
import { BOM_CATEGORIES, BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AssetFilters() {
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

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="자산 번호 또는 이름 검색"
          className="w-64"
        />
        <Button type="submit" variant="outline" size="icon" aria-label="검색">
          <Search />
        </Button>
      </form>

      <Select defaultValue={searchParams.get("condition") ?? "all"} onValueChange={(value) => updateParam("condition", value)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 상태</SelectItem>
          {ASSET_CONDITIONS.map((c) => (
            <SelectItem key={c} value={c}>
              {ASSET_CONDITION_LABELS[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={searchParams.get("category") ?? "all"} onValueChange={(value) => updateParam("category", value)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Engineering Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 카테고리</SelectItem>
          {BOM_CATEGORIES.filter((category) => category !== "common").map((category) => (
            <SelectItem key={category} value={category}>
              {BOM_CATEGORY_LABELS[category]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
