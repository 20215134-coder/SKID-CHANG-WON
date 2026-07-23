import { DeleteAnnouncementButton } from "@/components/announcements/delete-announcement-button";
import { EditAnnouncementButton } from "@/components/announcements/edit-announcement-button";
import type { Announcement } from "@/services/announcement-service";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function AnnouncementItem({ announcement, canManage }: { announcement: Announcement; canManage: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium">{announcement.title}</h3>
        {canManage ? (
          <div className="flex shrink-0 gap-1">
            <EditAnnouncementButton announcement={announcement} />
            <DeleteAnnouncementButton id={announcement.id} title={announcement.title} />
          </div>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {announcement.createdByName ?? "알 수 없음"} · {formatDate(announcement.createdAt)}
      </p>
      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{announcement.content}</p>
    </div>
  );
}
