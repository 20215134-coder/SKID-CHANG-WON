import { createClient } from "@/lib/supabase/server";

export interface Subsystem {
  id: string;
  categoryId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export async function listSubsystems(categoryId: string): Promise<Subsystem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subsystems")
    .select("id, category_id, name, created_at, updated_at")
    .eq("category_id", categoryId)
    .order("name", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getSubsystem(id: string): Promise<Subsystem | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("subsystems")
    .select("id, category_id, name, created_at, updated_at")
    .eq("id", id)
    .single();

  if (!row) return null;

  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
