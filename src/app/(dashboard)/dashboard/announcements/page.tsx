import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/require-user";
import { canManageAnnouncements } from "@/lib/announcements/permissions";
import { listAnnouncements } from "@/services/announcement-service";
import { AnnouncementItem } from "@/components/announcements/announcement-item";
import { CreateAnnouncementButton } from "@/components/announcements/create-announcement-button";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";

export const metadata: Metadata = {
  title: "공지 | FSAE ERP",
};

export default async function AnnouncementsPage() {
  const profile = await requireUser();
  const announcements = await listAnnouncements();
  const canManage = canManageAnnouncements(profile);

  return (
    <div className="flex flex-col gap-4">
      <VehicleBreadcrumb items={[{ label: "대시보드", href: "/dashboard" }, { label: "공지" }]} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">공지</h2>
        {canManage ? <CreateAnnouncementButton /> : null}
      </div>

      {announcements.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">등록된 공지가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((announcement) => (
            <AnnouncementItem key={announcement.id} announcement={announcement} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  );
}
