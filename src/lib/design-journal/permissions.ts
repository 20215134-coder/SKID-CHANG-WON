import type { AuthProfile } from "@/types/auth";
import type { BomCategory } from "@/types/database.types";

interface JournalScope {
  authorId: string;
  engineeringCategory: BomCategory;
}

// 게시글 편집(제목/내용/파일/태그 등) 권한: 관리자, 팀장, 담당 파트장, 작성자 본인.
export function canEditDesignJournal(profile: Pick<AuthProfile, "id" | "role" | "isTeamLeader" | "bomCategory">, journal: JournalScope): boolean {
  if (profile.role === "admin" || profile.isTeamLeader) return true;
  if (profile.role === "leader" && profile.bomCategory === journal.engineeringCategory) return true;
  return journal.authorId === profile.id;
}

// 게시글 삭제 권한: 작성자 본인은 제외 (관리자/팀장/담당 파트장만).
export function canDeleteDesignJournal(profile: Pick<AuthProfile, "role" | "isTeamLeader" | "bomCategory">, journal: JournalScope): boolean {
  if (profile.role === "admin" || profile.isTeamLeader) return true;
  return profile.role === "leader" && profile.bomCategory === journal.engineeringCategory;
}
