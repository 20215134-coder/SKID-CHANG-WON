import { createClient } from "@/lib/supabase/server";

export interface Assembly {
  id: string;
  subsystemId: string;
  name: string;
  description: string | null;
  revision: string;
  createdAt: string;
  updatedAt: string;
}

export async function listAssemblies(subsystemId: string): Promise<Assembly[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assemblies")
    .select("id, subsystem_id, name, description, revision, created_at, updated_at")
    .eq("subsystem_id", subsystemId)
    .order("name", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    subsystemId: row.subsystem_id,
    name: row.name,
    description: row.description,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getAssembly(id: string): Promise<Assembly | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("assemblies")
    .select("id, subsystem_id, name, description, revision, created_at, updated_at")
    .eq("id", id)
    .single();

  if (!row) return null;

  return {
    id: row.id,
    subsystemId: row.subsystem_id,
    name: row.name,
    description: row.description,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface AssemblyStats {
  partCount: number;
  totalWeight: number;
  completedCount: number;
  progressPercent: number;
}

export async function getAssemblyStats(assemblyId: string): Promise<AssemblyStats> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bom_parts")
    .select("weight, manufacturing_status")
    .eq("assembly_id", assemblyId);

  const rows = data ?? [];
  const partCount = rows.length;
  const totalWeight = rows.reduce((sum, row) => sum + (row.weight ?? 0), 0);
  const completedCount = rows.filter((row) => row.manufacturing_status === "completed").length;

  return {
    partCount,
    totalWeight,
    completedCount,
    progressPercent: partCount > 0 ? Math.round((completedCount / partCount) * 100) : 0,
  };
}
