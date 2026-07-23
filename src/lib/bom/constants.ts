import type { BomCategory, ManufacturingStatus } from "@/types/database.types";

export const BOM_CATEGORIES: BomCategory[] = ["chassis", "powertrain", "aero", "electrical", "common"];

export const BOM_CATEGORY_LABELS: Record<BomCategory, string> = {
  chassis: "Chassis",
  powertrain: "Powertrain",
  aero: "Aero",
  electrical: "Electrical",
  common: "공용",
};

export const MANUFACTURING_STATUSES: ManufacturingStatus[] = [
  "designing",
  "ready_for_manufacturing",
  "manufacturing",
  "inspection",
  "assembly",
  "completed",
];

export const MANUFACTURING_STATUS_LABELS: Record<ManufacturingStatus, string> = {
  designing: "Designing",
  ready_for_manufacturing: "Ready for Manufacturing",
  manufacturing: "Manufacturing",
  inspection: "Inspection",
  assembly: "Assembly",
  completed: "Completed",
};
