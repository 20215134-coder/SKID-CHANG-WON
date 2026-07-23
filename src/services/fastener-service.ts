import { createClient } from "@/lib/supabase/server";

export interface Fastener {
  id: string;
  name: string;
  spec: string | null;
  unitCost: number | null;
  supplier: string | null;
  createdAt: string;
  updatedAt: string;
}

const FASTENER_COLUMNS = "id, name, spec, unit_cost, supplier, created_at, updated_at";

export async function listFasteners(): Promise<Fastener[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("fasteners").select(FASTENER_COLUMNS).order("name", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    spec: row.spec,
    unitCost: row.unit_cost,
    supplier: row.supplier,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getFastener(id: string): Promise<Fastener | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("fasteners").select(FASTENER_COLUMNS).eq("id", id).single();
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    spec: row.spec,
    unitCost: row.unit_cost,
    supplier: row.supplier,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface FastenerOption {
  id: string;
  name: string;
  spec: string | null;
  unitCost: number | null;
}

export async function listFastenerOptions(): Promise<FastenerOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("fasteners").select("id, name, spec, unit_cost").order("name", { ascending: true });

  return (data ?? []).map((row) => ({ id: row.id, name: row.name, spec: row.spec, unitCost: row.unit_cost }));
}

export interface AssemblyFastener {
  id: string;
  assemblyId: string;
  fastenerId: string;
  name: string;
  spec: string | null;
  unitCost: number | null;
  quantity: number;
}

export async function listAssemblyFasteners(assemblyId: string): Promise<AssemblyFastener[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assembly_fasteners")
    .select("id, assembly_id, fastener_id, quantity")
    .eq("assembly_id", assemblyId);

  const rows = data ?? [];
  const fastenerIds = Array.from(new Set(rows.map((row) => row.fastener_id)));

  const { data: fasteners } =
    fastenerIds.length > 0
      ? await supabase.from("fasteners").select("id, name, spec, unit_cost").in("id", fastenerIds)
      : { data: [] as { id: string; name: string; spec: string | null; unit_cost: number | null }[] };

  const fastenerById = new Map((fasteners ?? []).map((row) => [row.id, row]));

  return rows
    .map((row) => {
      const fastener = fastenerById.get(row.fastener_id);
      return {
        id: row.id,
        assemblyId: row.assembly_id,
        fastenerId: row.fastener_id,
        name: fastener?.name ?? "",
        spec: fastener?.spec ?? null,
        unitCost: fastener?.unit_cost ?? null,
        quantity: row.quantity,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
