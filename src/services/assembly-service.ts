import { createClient } from "@/lib/supabase/server";
import type { Subsystem } from "@/services/subsystem-service";
import type { EngineeringCategory } from "@/services/vehicle-service";

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

interface AssemblyAncestorRow {
  id: string;
  subsystem_id: string;
  name: string;
  description: string | null;
  revision: string;
  created_at: string;
  updated_at: string;
  subsystems: {
    id: string;
    category_id: string;
    name: string;
    created_at: string;
    updated_at: string;
    engineering_categories: { id: string; vehicle_id: string; name: EngineeringCategory["name"] };
  };
}

// Assembly 상세 페이지는 assembly → subsystem → category를 매번 3번 순차 조회했는데,
// PostgREST 중첩 select로 한 번에 가져와 왕복을 줄인다.
export async function getAssemblyWithAncestors(
  id: string,
): Promise<{ assembly: Assembly; subsystem: Subsystem; category: EngineeringCategory } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assemblies")
    .select(
      "id, subsystem_id, name, description, revision, created_at, updated_at, subsystems(id, category_id, name, created_at, updated_at, engineering_categories(id, vehicle_id, name))",
    )
    .eq("id", id)
    .single();

  if (!data) return null;
  const row = data as unknown as AssemblyAncestorRow;
  if (!row.subsystems || !row.subsystems.engineering_categories) return null;

  return {
    assembly: {
      id: row.id,
      subsystemId: row.subsystem_id,
      name: row.name,
      description: row.description,
      revision: row.revision,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    subsystem: {
      id: row.subsystems.id,
      categoryId: row.subsystems.category_id,
      name: row.subsystems.name,
      createdAt: row.subsystems.created_at,
      updatedAt: row.subsystems.updated_at,
    },
    category: {
      id: row.subsystems.engineering_categories.id,
      vehicleId: row.subsystems.engineering_categories.vehicle_id,
      name: row.subsystems.engineering_categories.name,
    },
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
