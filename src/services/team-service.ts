import { createClient } from "@/lib/supabase/server";
import type { BomCategory, MemberStatus, UserRole } from "@/types/database.types";

export interface TeamMember {
  id: string;
  email: string;
  fullName: string | null;
  studentId: string | null;
  phone: string | null;
  department: string | null;
  bomCategory: BomCategory | null;
  role: UserRole;
  status: MemberStatus;
  joinedAt: string;
  isTreasurer: boolean;
  isTeamLeader: boolean;
}

export interface ListMembersParams {
  search?: string;
  role?: UserRole;
  department?: string;
  status?: MemberStatus | "all";
  page?: number;
  pageSize?: number;
}

export interface ListMembersResult {
  members: TeamMember[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 10;

export async function listMembers(params: ListMembersParams): Promise<ListMembersResult> {
  const supabase = await createClient();
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("profiles")
    .select(
      "id, email, full_name, student_id, phone, department, bom_category, role, status, joined_at, is_treasurer, is_team_leader",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (params.search) {
    query = query.ilike("full_name", `%${params.search}%`);
  }
  if (params.role) {
    query = query.eq("role", params.role);
  }
  if (params.department) {
    query = query.eq("department", params.department);
  }
  if (!params.status) {
    query = query.eq("status", "active");
  } else if (params.status !== "all") {
    query = query.eq("status", params.status);
  }

  const { data, count } = await query.range(from, to);
  const rows = data ?? [];

  return {
    members: rows.map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      studentId: row.student_id,
      phone: row.phone,
      department: row.department,
      bomCategory: row.bom_category,
      role: row.role,
      status: row.status,
      joinedAt: row.joined_at,
      isTreasurer: row.is_treasurer,
      isTeamLeader: row.is_team_leader,
    })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function listDepartments(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("department").not("department", "is", null);

  const departments = new Set(
    (data ?? []).map((row) => row.department).filter((department): department is string => Boolean(department)),
  );

  return Array.from(departments).sort();
}

export interface MemberOption {
  id: string;
  label: string;
}

export async function listActiveMemberOptions(): Promise<MemberOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("status", "active")
    .order("full_name", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    label: row.full_name ?? row.email,
  }));
}
