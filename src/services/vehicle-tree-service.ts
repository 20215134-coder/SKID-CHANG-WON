import { createClient } from "@/lib/supabase/server";
import { listCategories } from "@/services/vehicle-service";
import type { BomCategory } from "@/types/database.types";

export interface TreePart {
  id: string;
  partNumber: string;
  partName: string;
}

export interface TreeAssembly {
  id: string;
  name: string;
  parts: TreePart[];
}

export interface TreeSubsystem {
  id: string;
  name: string;
  assemblies: TreeAssembly[];
}

export interface TreeCategory {
  id: string;
  name: BomCategory;
  subsystems: TreeSubsystem[];
}

export async function getVehicleTree(vehicleId: string): Promise<TreeCategory[]> {
  const supabase = await createClient();
  const categories = await listCategories(vehicleId);
  const categoryIds = categories.map((category) => category.id);

  const { data: subsystemRows } =
    categoryIds.length > 0
      ? await supabase.from("subsystems").select("id, category_id, name").in("category_id", categoryIds).order("name")
      : { data: [] as { id: string; category_id: string; name: string }[] };

  const subsystemIds = (subsystemRows ?? []).map((row) => row.id);

  const { data: assemblyRows } =
    subsystemIds.length > 0
      ? await supabase.from("assemblies").select("id, subsystem_id, name").in("subsystem_id", subsystemIds).order("name")
      : { data: [] as { id: string; subsystem_id: string; name: string }[] };

  const assemblyIds = (assemblyRows ?? []).map((row) => row.id);

  const { data: partRows } =
    assemblyIds.length > 0
      ? await supabase
          .from("bom_parts")
          .select("id, assembly_id, part_number, part_name")
          .in("assembly_id", assemblyIds)
          .order("part_number")
      : { data: [] as { id: string; assembly_id: string; part_number: string; part_name: string }[] };

  const partsByAssembly = new Map<string, TreePart[]>();
  for (const row of partRows ?? []) {
    const list = partsByAssembly.get(row.assembly_id) ?? [];
    list.push({ id: row.id, partNumber: row.part_number, partName: row.part_name });
    partsByAssembly.set(row.assembly_id, list);
  }

  const assembliesBySubsystem = new Map<string, TreeAssembly[]>();
  for (const row of assemblyRows ?? []) {
    const list = assembliesBySubsystem.get(row.subsystem_id) ?? [];
    list.push({ id: row.id, name: row.name, parts: partsByAssembly.get(row.id) ?? [] });
    assembliesBySubsystem.set(row.subsystem_id, list);
  }

  const subsystemsByCategory = new Map<string, TreeSubsystem[]>();
  for (const row of subsystemRows ?? []) {
    const list = subsystemsByCategory.get(row.category_id) ?? [];
    list.push({ id: row.id, name: row.name, assemblies: assembliesBySubsystem.get(row.id) ?? [] });
    subsystemsByCategory.set(row.category_id, list);
  }

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    subsystems: subsystemsByCategory.get(category.id) ?? [],
  }));
}
