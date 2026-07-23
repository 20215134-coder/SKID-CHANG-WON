import { createClient } from "@/lib/supabase/server";
import type { AnnualPlanStatus } from "@/types/database.types";

export interface AnnualPlan {
  id: string;
  title: string;
  description: string | null;
  season: number;
  startDate: string;
  endDate: string;
  status: AnnualPlanStatus;
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

const PLAN_COLUMNS = "id, title, description, season, start_date, end_date, status, created_by, created_at, updated_at";

type PlanRow = {
  id: string;
  title: string;
  description: string | null;
  season: number;
  start_date: string;
  end_date: string;
  status: AnnualPlanStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

async function mapPlanRows(supabase: Awaited<ReturnType<typeof createClient>>, rows: PlanRow[]): Promise<AnnualPlan[]> {
  if (rows.length === 0) return [];

  const creatorIds = Array.from(new Set(rows.map((row) => row.created_by).filter((id): id is string => Boolean(id))));
  const { data: profiles } =
    creatorIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", creatorIds)
      : { data: [] as { id: string; full_name: string | null }[] };

  const nameById = new Map((profiles ?? []).map((row) => [row.id, row.full_name]));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    season: row.season,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    createdById: row.created_by,
    createdByName: row.created_by ? (nameById.get(row.created_by) ?? null) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function listAnnualPlans(): Promise<AnnualPlan[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("annual_plans").select(PLAN_COLUMNS).order("season", { ascending: false });

  return mapPlanRows(supabase, (data ?? []) as PlanRow[]);
}

export async function getAnnualPlan(id: string): Promise<AnnualPlan | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("annual_plans").select(PLAN_COLUMNS).eq("id", id).single();

  if (!row) return null;
  const mapped = await mapPlanRows(supabase, [row as PlanRow]);
  return mapped[0] ?? null;
}

// 대시보드/캘린더 등에서 "현재 계획"의 기본값으로 쓴다: active 상태 우선, 없으면 가장 최근 season.
export async function getCurrentAnnualPlan(): Promise<AnnualPlan | null> {
  const supabase = await createClient();

  const { data: activeRow } = await supabase.from("annual_plans").select(PLAN_COLUMNS).eq("status", "active").limit(1).maybeSingle();

  if (activeRow) {
    const mapped = await mapPlanRows(supabase, [activeRow as PlanRow]);
    return mapped[0] ?? null;
  }

  const { data: latestRow } = await supabase
    .from("annual_plans")
    .select(PLAN_COLUMNS)
    .order("season", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestRow) return null;
  const mapped = await mapPlanRows(supabase, [latestRow as PlanRow]);
  return mapped[0] ?? null;
}
