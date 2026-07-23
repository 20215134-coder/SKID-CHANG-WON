import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Boxes,
  CalendarDays,
  Car,
  Database,
  FolderOpen,
  Hammer,
  History,
  Megaphone,
  ShoppingCart,
  TriangleAlert,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ROLE_LABELS } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/require-user";
import { canManageAnnouncements } from "@/lib/announcements/permissions";
import { BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { MOVEMENT_TYPE_LABELS } from "@/lib/inventory/constants";
import { formatCurrency } from "@/lib/purchasing/format";
import { listAnnouncements } from "@/services/announcement-service";
import { listVehicleTotalBudgets } from "@/services/budget-service";
import { listDesignJournals } from "@/services/design-journal-service";
import { getInventoryDashboardStats } from "@/services/inventory-dashboard-service";
import { listInventoryMovements } from "@/services/inventory-service";
import { listThisMonthDeadlines } from "@/services/milestone-service";
import { getTeamStats } from "@/services/profile-service";
import { listWorkJournals } from "@/services/work-journal-service";
import { CreateAnnouncementButton } from "@/components/announcements/create-announcement-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "대시보드 | SKID",
};

const MODULE_LINKS: { title: string; href: string; icon: LucideIcon }[] = [
  { title: "Planning", href: "/dashboard/planning", icon: CalendarDays },
  { title: "Vehicle", href: "/dashboard/vehicle", icon: Car },
  { title: "Design Journal", href: "/dashboard/design-journal", icon: BookOpen },
  { title: "Work Journal", href: "/dashboard/work-journal", icon: Hammer },
  { title: "Consumable Inventory", href: "/dashboard/inventory", icon: Boxes },
  { title: "Assets", href: "/dashboard/assets", icon: Wrench },
  { title: "Files", href: "/dashboard/files", icon: FolderOpen },
  { title: "Purchasing", href: "/dashboard/purchasing", icon: ShoppingCart },
  { title: "Data", href: "/dashboard/data", icon: Database },
];

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default async function DashboardPage() {
  const profile = await requireUser();
  const [
    stats,
    inventoryStats,
    thisMonthDeadlines,
    vehicleBudgets,
    recentDesignJournals,
    recentWorkJournals,
    recentConsumableUsage,
    recentAnnouncements,
  ] = await Promise.all([
    getTeamStats(),
    getInventoryDashboardStats(),
    listThisMonthDeadlines(),
    listVehicleTotalBudgets(),
    listDesignJournals({ limit: 3 }),
    listWorkJournals({ limit: 3 }),
    listInventoryMovements({ movementType: "work_journal_consumption", pageSize: 3 }),
    listAnnouncements(3),
  ]);

  const canManageAnnouncementsPermission = canManageAnnouncements(profile);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          환영합니다, {profile.fullName ?? profile.email}님
        </h2>
        <p className="text-sm text-muted-foreground">
          현재 권한: <Badge variant="outline">{ROLE_LABELS[profile.role]}</Badge>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="size-4" />
                최근 공지
              </CardTitle>
              {canManageAnnouncementsPermission ? <CreateAnnouncementButton /> : null}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {recentAnnouncements.length === 0 ? (
              <p className="text-muted-foreground">등록된 공지가 없습니다.</p>
            ) : (
              recentAnnouncements.map((announcement) => (
                <Link key={announcement.id} href="/dashboard/announcements" className="block truncate hover:underline">
                  {announcement.title}
                  <span className="ml-1 text-xs text-muted-foreground">· {formatDate(announcement.createdAt)}</span>
                </Link>
              ))
            )}
            <Link href="/dashboard/announcements" className="text-xs text-muted-foreground hover:underline">
              전체보기
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4" />
              팀 현황
            </CardTitle>
            <CardDescription>전체 팀원 {stats.total}명</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4 text-sm">
            <span>관리자 {stats.admin}명</span>
            <span>팀장 {stats.leader}명</span>
            <span>팀원 {stats.member}명</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/planning">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarDays className="size-4" />
                이번 달 마감
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
              {thisMonthDeadlines.length === 0 ? (
                <p>이번 달 마감인 마일스톤이 없습니다.</p>
              ) : (
                thisMonthDeadlines.slice(0, 3).map((milestone) => (
                  <p key={milestone.id} className="truncate">
                    {milestone.title} · {formatDate(milestone.dueDate)}
                  </p>
                ))
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/purchasing/budget">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Wallet className="size-4" />
                예산 사용 현황
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
              {vehicleBudgets.length === 0 ? (
                <p>등록된 예산이 없습니다.</p>
              ) : (
                vehicleBudgets.slice(0, 3).map((budget) => (
                  <p key={budget.id} className="truncate">
                    {budget.vehicleName} · {formatCurrency(budget.usedBudget)} / {formatCurrency(budget.allocatedBudget)} (
                    {Math.round(budget.usagePercent)}%)
                  </p>
                ))
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/design-journal">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <BookOpen className="size-4" />
                Design Journal 최근 게시글
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
              {recentDesignJournals.length === 0 ? (
                <p>등록된 게시글이 없습니다.</p>
              ) : (
                recentDesignJournals.map((journal) => (
                  <p key={journal.id} className="truncate">
                    {journal.title} · {BOM_CATEGORY_LABELS[journal.engineeringCategory]} · {formatDate(journal.createdAt)}
                  </p>
                ))
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/work-journal">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Hammer className="size-4" />
                Work Journal 최근 게시글
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
              {recentWorkJournals.length === 0 ? (
                <p>등록된 작업일지가 없습니다.</p>
              ) : (
                recentWorkJournals.map((journal) => (
                  <p key={journal.id} className="truncate">
                    {journal.title} · {BOM_CATEGORY_LABELS[journal.engineeringCategory]} · {formatDate(journal.createdAt)}
                  </p>
                ))
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">재고 현황</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <Link href="/dashboard/inventory">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Boxes className="size-4" />
                  전체 재고 항목
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{inventoryStats.totalItems}</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/inventory?status=low_stock">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TriangleAlert className="size-4 text-destructive" />
                  재고 부족 항목
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{inventoryStats.lowStockCount}</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/inventory/history">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <History className="size-4" />
                  최근 입출고
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
                {inventoryStats.recentMovements.length === 0 ? (
                  <p>최근 이력이 없습니다.</p>
                ) : (
                  inventoryStats.recentMovements.slice(0, 3).map((movement) => (
                    <p key={movement.id} className="truncate">
                      {MOVEMENT_TYPE_LABELS[movement.movementType]} · {movement.itemCode} ·{" "}
                      {movement.previousQuantity}→{movement.newQuantity}
                    </p>
                  ))
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/inventory/history">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Hammer className="size-4" />
                  최근 소모품 사용
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
                {recentConsumableUsage.entries.length === 0 ? (
                  <p>최근 사용 이력이 없습니다.</p>
                ) : (
                  recentConsumableUsage.entries.map((movement) => (
                    <p key={movement.id} className="truncate">
                      {movement.itemName} · {movement.quantity}개 사용
                    </p>
                  ))
                )}
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">모듈 바로가기</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULE_LINKS.map((module) => (
            <Link key={module.href} href={module.href}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <module.icon className="size-4" />
                    {module.title}
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
