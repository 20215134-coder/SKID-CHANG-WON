import type { AuthProfile } from "@/types/auth";

// 공지 등록/수정/삭제 권한: Admin 또는 Team Leader (Planning 모듈과 동일한 관례).
export function canManageAnnouncements(profile: Pick<AuthProfile, "role" | "isTeamLeader">): boolean {
  return profile.role === "admin" || profile.isTeamLeader;
}
