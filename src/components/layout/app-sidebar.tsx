"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Boxes,
  CalendarDays,
  Car,
  Database,
  FolderOpen,
  Hammer,
  LayoutDashboard,
  ShoppingCart,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ROLE_LABELS } from "@/lib/auth/roles";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import type { AuthProfile } from "@/types/auth";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  matchPrefix?: string;
}

const NAV_ITEMS: NavItem[] = [
  { title: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { title: "Planning", href: "/dashboard/planning", icon: CalendarDays, matchPrefix: "/dashboard/planning" },
  { title: "Vehicle", href: "/dashboard/vehicle", icon: Car, matchPrefix: "/dashboard/vehicle" },
  { title: "Design Journal", href: "/dashboard/design-journal", icon: BookOpen, matchPrefix: "/dashboard/design-journal" },
  { title: "Work Journal", href: "/dashboard/work-journal", icon: Hammer, matchPrefix: "/dashboard/work-journal" },
  { title: "Consumable Inventory", href: "/dashboard/inventory", icon: Boxes, matchPrefix: "/dashboard/inventory" },
  { title: "Assets", href: "/dashboard/assets", icon: Wrench, matchPrefix: "/dashboard/assets" },
  { title: "Files", href: "/dashboard/files", icon: FolderOpen, matchPrefix: "/dashboard/files" },
];

interface NavGroup {
  title: string;
  icon: LucideIcon;
  matchPrefix: string;
  items: { title: string; href: string }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Purchasing",
    icon: ShoppingCart,
    matchPrefix: "/dashboard/purchasing",
    items: [
      { title: "구매 요청", href: "/dashboard/purchasing" },
      { title: "구매 이력", href: "/dashboard/purchasing/history" },
      { title: "승인 대기", href: "/dashboard/purchasing/approvals" },
      { title: "예산", href: "/dashboard/purchasing/budget" },
    ],
  },
];

const TRAILING_NAV_ITEMS: NavItem[] = [
  { title: "Data", href: "/dashboard/data", icon: Database, matchPrefix: "/dashboard/data" },
];

export function AppSidebar({ profile }: { profile: AuthProfile }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Wrench className="size-5 text-primary" />
          <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">SKID</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href || (item.matchPrefix ? pathname.startsWith(item.matchPrefix) : false)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {NAV_GROUPS.map((group) => (
                <SidebarMenuItem key={group.title}>
                  <SidebarMenuButton isActive={pathname.startsWith(group.matchPrefix)} tooltip={group.title}>
                    <group.icon />
                    <span>{group.title}</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {group.items.map((item) => (
                      <SidebarMenuSubItem key={item.href}>
                        <SidebarMenuSubButton render={<Link href={item.href} />} isActive={pathname === item.href}>
                          <span>{item.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarMenuItem>
              ))}

              {TRAILING_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href || (item.matchPrefix ? pathname.startsWith(item.matchPrefix) : false)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {profile.role === "admin" ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/dashboard/team" />}
                isActive={pathname.startsWith("/dashboard/team")}
                tooltip="팀원 관리"
              >
                <Users />
                <span>팀원 관리</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}
        <div className="flex items-center justify-between px-2 py-1.5 group-data-[collapsible=icon]:hidden">
          <span className="truncate text-sm font-medium">{profile.fullName ?? profile.email}</span>
          <Badge variant="secondary">{ROLE_LABELS[profile.role]}</Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
