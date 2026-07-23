import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireUser } from "@/lib/auth/require-user";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser();

  return (
    <SidebarProvider>
      <AppSidebar profile={profile} />
      <SidebarInset>
        <SiteHeader profile={profile} title="대시보드" />
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
