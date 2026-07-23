import { BOM_CATEGORIES, BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { createClient } from "@/lib/supabase/server";
import { getVehicle } from "@/services/vehicle-service";
import type { BomCategory } from "@/types/database.types";

export interface CostReportLine {
  no: number;
  categoryName: BomCategory;
  categoryLabel: string;
  subsystemName: string;
  assemblyName: string;
  itemName: string;
  supplier: string | null;
  unitCost: number;
  quantity: number;
  total: number;
  source: "part" | "fastener";
}

export interface CostReportCategorySummary {
  categoryName: BomCategory;
  categoryLabel: string;
  total: number;
}

export interface VehicleCostReport {
  vehicleId: string;
  vehicleName: string;
  competitionYear: number;
  totalCost: number;
  categorySummaries: CostReportCategorySummary[];
  lines: CostReportLine[];
}

export async function getVehicleCostReport(vehicleId: string): Promise<VehicleCostReport | null> {
  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) return null;

  const supabase = await createClient();

  const { data: categoryRows } = await supabase
    .from("engineering_categories")
    .select("id, name")
    .eq("vehicle_id", vehicleId);
  const categories = categoryRows ?? [];
  const categoryIds = categories.map((row) => row.id);
  const categoryNameById = new Map(categories.map((row) => [row.id, row.name]));

  const { data: subsystemRows } =
    categoryIds.length > 0
      ? await supabase.from("subsystems").select("id, category_id, name").in("category_id", categoryIds)
      : { data: [] as { id: string; category_id: string; name: string }[] };
  const subsystems = subsystemRows ?? [];
  const subsystemIds = subsystems.map((row) => row.id);
  const subsystemById = new Map(subsystems.map((row) => [row.id, row]));

  const { data: assemblyRows } =
    subsystemIds.length > 0
      ? await supabase.from("assemblies").select("id, subsystem_id, name").in("subsystem_id", subsystemIds)
      : { data: [] as { id: string; subsystem_id: string; name: string }[] };
  const assemblies = assemblyRows ?? [];
  const assemblyIds = assemblies.map((row) => row.id);
  const assemblyById = new Map(assemblies.map((row) => [row.id, row]));

  function resolveCategoryOfAssembly(assemblyId: string): BomCategory | null {
    const assembly = assemblyById.get(assemblyId);
    if (!assembly) return null;
    const subsystem = subsystemById.get(assembly.subsystem_id);
    if (!subsystem) return null;
    return categoryNameById.get(subsystem.category_id) ?? null;
  }

  // ── BOM Parts ──
  const { data: partRows } =
    assemblyIds.length > 0
      ? await supabase
          .from("bom_parts")
          .select("id, assembly_id, part_name, supplier, inventory_item_id, asset_id, material_quantity")
          .in("assembly_id", assemblyIds)
      : {
          data: [] as {
            id: string;
            assembly_id: string;
            part_name: string;
            supplier: string | null;
            inventory_item_id: string | null;
            asset_id: string | null;
            material_quantity: number;
          }[],
        };
  const parts = partRows ?? [];

  const inventoryItemIds = Array.from(new Set(parts.map((row) => row.inventory_item_id).filter((id): id is string => Boolean(id))));
  const assetIds = Array.from(new Set(parts.map((row) => row.asset_id).filter((id): id is string => Boolean(id))));

  const [{ data: inventoryItems }, { data: assets }] = await Promise.all([
    inventoryItemIds.length > 0
      ? supabase.from("inventory_items").select("id, unit_cost").in("id", inventoryItemIds)
      : Promise.resolve({ data: [] as { id: string; unit_cost: number | null }[] }),
    assetIds.length > 0
      ? supabase.from("assets").select("id, purchase_cost").in("id", assetIds)
      : Promise.resolve({ data: [] as { id: string; purchase_cost: number | null }[] }),
  ]);
  const inventoryUnitCostById = new Map((inventoryItems ?? []).map((row) => [row.id, row.unit_cost]));
  const assetUnitCostById = new Map((assets ?? []).map((row) => [row.id, row.purchase_cost]));

  // ── Assembly Fasteners ──
  const { data: fastenerLinkRows } =
    assemblyIds.length > 0
      ? await supabase.from("assembly_fasteners").select("id, assembly_id, fastener_id, quantity").in("assembly_id", assemblyIds)
      : { data: [] as { id: string; assembly_id: string; fastener_id: string; quantity: number }[] };
  const fastenerLinks = fastenerLinkRows ?? [];

  const fastenerIds = Array.from(new Set(fastenerLinks.map((row) => row.fastener_id)));
  const { data: fastenerRows } =
    fastenerIds.length > 0
      ? await supabase.from("fasteners").select("id, name, spec, unit_cost, supplier").in("id", fastenerIds)
      : { data: [] as { id: string; name: string; spec: string | null; unit_cost: number | null; supplier: string | null }[] };
  const fastenerById = new Map((fastenerRows ?? []).map((row) => [row.id, row]));

  const lines: CostReportLine[] = [];

  for (const part of parts) {
    const categoryName = resolveCategoryOfAssembly(part.assembly_id);
    if (!categoryName) continue;
    const assembly = assemblyById.get(part.assembly_id);
    const subsystem = assembly ? subsystemById.get(assembly.subsystem_id) : undefined;

    const unitCost = part.inventory_item_id
      ? (inventoryUnitCostById.get(part.inventory_item_id) ?? 0)
      : part.asset_id
        ? (assetUnitCostById.get(part.asset_id) ?? 0)
        : 0;
    const quantity = part.material_quantity;

    lines.push({
      no: 0,
      categoryName,
      categoryLabel: BOM_CATEGORY_LABELS[categoryName],
      subsystemName: subsystem?.name ?? "",
      assemblyName: assembly?.name ?? "",
      itemName: part.part_name,
      supplier: part.supplier,
      unitCost: unitCost ?? 0,
      quantity,
      total: (unitCost ?? 0) * quantity,
      source: "part",
    });
  }

  for (const link of fastenerLinks) {
    const categoryName = resolveCategoryOfAssembly(link.assembly_id);
    if (!categoryName) continue;
    const assembly = assemblyById.get(link.assembly_id);
    const subsystem = assembly ? subsystemById.get(assembly.subsystem_id) : undefined;
    const fastener = fastenerById.get(link.fastener_id);

    const unitCost = fastener?.unit_cost ?? 0;
    const quantity = link.quantity;

    lines.push({
      no: 0,
      categoryName,
      categoryLabel: BOM_CATEGORY_LABELS[categoryName],
      subsystemName: subsystem?.name ?? "",
      assemblyName: assembly?.name ?? "",
      itemName: fastener ? [fastener.name, fastener.spec].filter(Boolean).join(" · ") : "",
      supplier: fastener?.supplier ?? null,
      unitCost,
      quantity,
      total: unitCost * quantity,
      source: "fastener",
    });
  }

  const categoryOrder = new Map(BOM_CATEGORIES.map((name, index) => [name, index]));
  lines.sort((a, b) => {
    const orderDiff = (categoryOrder.get(a.categoryName) ?? 0) - (categoryOrder.get(b.categoryName) ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return a.assemblyName.localeCompare(b.assemblyName);
  });
  lines.forEach((line, index) => {
    line.no = index + 1;
  });

  const categorySummaries: CostReportCategorySummary[] = BOM_CATEGORIES.map((categoryName) => ({
    categoryName,
    categoryLabel: BOM_CATEGORY_LABELS[categoryName],
    total: lines.filter((line) => line.categoryName === categoryName).reduce((sum, line) => sum + line.total, 0),
  })).filter((summary) => summary.total > 0 || lines.some((line) => line.categoryName === summary.categoryName));

  const totalCost = lines.reduce((sum, line) => sum + line.total, 0);

  return {
    vehicleId,
    vehicleName: vehicle.vehicleName,
    competitionYear: vehicle.competitionYear,
    totalCost,
    categorySummaries,
    lines,
  };
}
