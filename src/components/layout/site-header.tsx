import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import type { AuthProfile } from "@/types/auth";

export function SiteHeader({ profile, title }: { profile: AuthProfile; title: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="flex-1 text-sm font-semibold">{title}</h1>
      <ThemeToggle />
      <UserMenu profile={profile} />
    </header>
  );
}
