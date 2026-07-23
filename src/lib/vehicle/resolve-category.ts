import { getAssembly } from "@/services/assembly-service";
import { getPart } from "@/services/bom-service";
import { getSubsystem } from "@/services/subsystem-service";
import { getCategory } from "@/services/vehicle-service";
import type { BomCategory } from "@/types/database.types";

export async function resolveSubsystemCategory(subsystemId: string): Promise<BomCategory | null> {
  const subsystem = await getSubsystem(subsystemId);
  if (!subsystem) return null;
  const category = await getCategory(subsystem.categoryId);
  return category?.name ?? null;
}

export async function resolveAssemblyCategory(assemblyId: string): Promise<BomCategory | null> {
  const assembly = await getAssembly(assemblyId);
  if (!assembly) return null;
  return resolveSubsystemCategory(assembly.subsystemId);
}

export async function resolvePartCategory(partId: string): Promise<BomCategory | null> {
  const part = await getPart(partId);
  if (!part) return null;
  return resolveAssemblyCategory(part.assemblyId);
}
