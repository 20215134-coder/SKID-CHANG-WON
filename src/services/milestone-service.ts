import { createClient } from "@/lib/supabase/server";
import type { MilestoneStatus } from "@/types/database.types";

export interface Milestone {
  id: string;
  annualPlanId: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: MilestoneStatus;
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

const MILESTONE_COLUMNS = "id, annual_plan_id, title, description, due_date, status, created_by, created_at, updated_at";

type MilestoneRow = {
  id: string;
  annual_plan_id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: MilestoneStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

async function mapMilestoneRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: MilestoneRow[],
): Promise<Milestone[]> {
  if (rows.length === 0) return [];

  const creatorIds = Array.from(new Set(rows.map((row) => row.created_by).filter((id): id is string => Boolean(id))));
  const { data: profiles } =
    creatorIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", creatorIds)
      : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((profiles ?? []).map((row) => [row.id, row.full_name]));

  return rows.map((row) => ({
    id: row.id,
    annualPlanId: row.annual_plan_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    status: row.status,
    createdById: row.created_by,
    createdByName: row.created_by ? (nameById.get(row.created_by) ?? null) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function listMilestones(annualPlanId: string): Promise<Milestone[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("milestones")
    .select(MILESTONE_COLUMNS)
    .eq("annual_plan_id", annualPlanId)
    .order("due_date", { ascending: true });

  return mapMilestoneRows(supabase, (data ?? []) as MilestoneRow[]);
}

export async function getMilestone(id: string): Promise<Milestone | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("milestones").select(MILESTONE_COLUMNS).eq("id", id).single();

  if (!row) return null;
  const mapped = await mapMilestoneRows(supabase, [row as MilestoneRow]);
  return mapped[0] ?? null;
}

export async function listThisMonthDeadlines(): Promise<Milestone[]> {
  const supabase = await createClient();
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const { data } = await supabase
    .from("milestones")
    .select(MILESTONE_COLUMNS)
    .neq("status", "completed")
    .gte("due_date", monthStart)
    .lte("due_date", monthEnd)
    .order("due_date", { ascending: true });

  return mapMilestoneRows(supabase, (data ?? []) as MilestoneRow[]);
}

export interface MilestoneOption {
  id: string;
  title: string;
  dueDate: string;
}

export async function listMilestoneOptions(annualPlanId: string): Promise<MilestoneOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("milestones")
    .select("id, title, due_date")
    .eq("annual_plan_id", annualPlanId)
    .order("due_date", { ascending: true });

  return (data ?? []).map((row) => ({ id: row.id, title: row.title, dueDate: row.due_date }));
}
