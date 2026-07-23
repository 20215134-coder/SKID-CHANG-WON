"use client";

import { type FormEvent, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { STATUS_LABELS } from "@/components/team/status-badge";
import type { MemberStatus, UserRole } from "@/types/database.types";

const ROLES: UserRole[] = ["admin", "leader", "member"];
const STATUSES: MemberStatus[] = ["active", "pending", "inactive"];

export function MemberFilters({
  departments,
  canFilterByStatus,
}: {
  departments: string[];
  canFilterByStatus: boolean;
}) {
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
          placeholder="이름으로 검색"
          className="w-48"
        />
        <Button type="submit" variant="outline" size="icon" aria-label="검색">
          <Search />
        </Button>
      </form>

      <Select defaultValue={searchParams.get("role") ?? "all"} onValueChange={(value) => updateParam("role", value)}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="권한" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 권한</SelectItem>
          {ROLES.map((role) => (
            <SelectItem key={role} value={role}>
              {ROLE_LABELS[role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("department") ?? "all"}
        onValueChange={(value) => updateParam("department", value)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="부서" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 부서</SelectItem>
          {departments.map((department) => (
            <SelectItem key={department} value={department}>
              {department}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {canFilterByStatus ? (
        <Select
          defaultValue={searchParams.get("status") ?? "active"}
          onValueChange={(value) => updateParam("status", value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
            <SelectItem value="all">전체</SelectItem>
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
