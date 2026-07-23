import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/require-user";
import { listDepartments, listMembers } from "@/services/team-service";
import { MemberFilters } from "@/components/team/member-filters";
import { MemberPagination } from "@/components/team/member-pagination";
import { MemberTable } from "@/components/team/member-table";
import type { MemberStatus, UserRole } from "@/types/database.types";

export const metadata: Metadata = {
  title: "팀원 관리 | FSAE ERP",
};

const ROLE_VALUES: UserRole[] = ["admin", "leader", "member"];
const STATUS_VALUES: MemberStatus[] = ["pending", "active", "inactive"];

interface TeamPageSearchParams {
  search?: string;
  role?: string;
  department?: string;
  status?: string;
  page?: string;
  [key: string]: string | undefined;
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<TeamPageSearchParams>;
}) {
  const profile = await requireUser();
  const params = await searchParams;

  const role = ROLE_VALUES.includes(params.role as UserRole) ? (params.role as UserRole) : undefined;
  const status =
    params.status === "all" || STATUS_VALUES.includes(params.status as MemberStatus)
      ? (params.status as MemberStatus | "all")
      : undefined;
  const page = params.page ? Number(params.page) : 1;

  const [departments, result] = await Promise.all([
    listDepartments(),
    listMembers({
      search: params.search,
      role,
      department: params.department,
      status,
      page,
    }),
  ]);

  const canFilterByStatus = profile.role === "admin";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">팀원 관리</h2>
        <p className="text-sm text-muted-foreground">
          전체 {result.total}명{profile.role === "member" ? " · 조회만 가능합니다." : ""}
        </p>
      </div>

      <MemberFilters departments={departments} canFilterByStatus={canFilterByStatus} />

      <MemberTable members={result.members} actingRole={profile.role} />

      <MemberPagination page={result.page} pageSize={result.pageSize} total={result.total} searchParams={params} />
    </div>
  );
}
