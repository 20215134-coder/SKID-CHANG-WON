"use client";

import { LogOut } from "lucide-react";

import { logout } from "@/features/auth/actions";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuthProfile } from "@/types/auth";

function initials(profile: AuthProfile) {
  const source = profile.fullName ?? profile.email;
  return source.slice(0, 2).toUpperCase();
}

export function UserMenu({ profile }: { profile: AuthProfile }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <Avatar>
          <AvatarFallback>{initials(profile)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-1 px-1.5 py-1">
            <span className="text-sm font-medium">{profile.fullName ?? "이름 미등록"}</span>
            <span className="truncate text-xs text-muted-foreground">{profile.email}</span>
            <Badge variant="secondary" className="mt-1 w-fit">
              {ROLE_LABELS[profile.role]}
            </Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => logout()}>
          <LogOut />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
