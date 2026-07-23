import { createClient } from "@/lib/supabase/server";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

const ANNOUNCEMENT_COLUMNS = "id, title, content, created_by, created_at, updated_at";

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

async function mapAnnouncementRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: AnnouncementRow[],
): Promise<Announcement[]> {
  if (rows.length === 0) return [];

  const creatorIds = Array.from(new Set(rows.map((row) => row.created_by).filter((id): id is string => Boolean(id))));
  const { data: profiles } =
    creatorIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", creatorIds)
      : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((profiles ?? []).map((row) => [row.id, row.full_name]));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    createdById: row.created_by,
    createdByName: row.created_by ? (nameById.get(row.created_by) ?? null) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function listAnnouncements(limit?: number): Promise<Announcement[]> {
  const supabase = await createClient();
  let query = supabase.from("announcements").select(ANNOUNCEMENT_COLUMNS).order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data } = await query;
  return mapAnnouncementRows(supabase, (data ?? []) as AnnouncementRow[]);
}

export async function getAnnouncement(id: string): Promise<Announcement | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("announcements").select(ANNOUNCEMENT_COLUMNS).eq("id", id).single();
  if (!row) return null;

  const mapped = await mapAnnouncementRows(supabase, [row as AnnouncementRow]);
  return mapped[0] ?? null;
}
