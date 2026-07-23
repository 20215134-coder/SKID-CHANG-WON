import { createClient } from "@/lib/supabase/server";
import type { BomCategory, VehicleStatus } from "@/types/database.types";

export interface Vehicle {
  id: string;
  vehicleName: string;
  competitionYear: number;
  status: VehicleStatus;
  createdAt: string;
}

export async function listVehicles(): Promise<Vehicle[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("id, vehicle_name, competition_year, status, created_at")
    .order("competition_year", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    vehicleName: row.vehicle_name,
    competitionYear: row.competition_year,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("vehicles")
    .select("id, vehicle_name, competition_year, status, created_at")
    .eq("id", id)
    .single();

  if (!row) return null;

  return {
    id: row.id,
    vehicleName: row.vehicle_name,
    competitionYear: row.competition_year,
    status: row.status,
    createdAt: row.created_at,
  };
}

export interface EngineeringCategory {
  id: string;
  vehicleId: string;
  name: BomCategory;
}

export async function listCategories(vehicleId: string): Promise<EngineeringCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("engineering_categories")
    .select("id, vehicle_id, name")
    .eq("vehicle_id", vehicleId)
    .order("name", { ascending: true });

  return (data ?? []).map((row) => ({ id: row.id, vehicleId: row.vehicle_id, name: row.name }));
}

export async function getCategory(id: string): Promise<EngineeringCategory | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("engineering_categories")
    .select("id, vehicle_id, name")
    .eq("id", id)
    .single();

  if (!row) return null;
  return { id: row.id, vehicleId: row.vehicle_id, name: row.name };
}
