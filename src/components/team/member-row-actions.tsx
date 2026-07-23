"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import {
  approveMember,
  assignTeamLeader,
  assignTreasurer,
  deactivateMember,
  reactivateMember,
  removeTeamLeader,
  removeTreasurer,
} from "@/features/team/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MemberEditSheet } from "@/components/team/member-edit-sheet";
import type { TeamMember } from "@/services/team-service";
import type { UserRole } from "@/types/database.types";

export function MemberRowActions({ member, actingRole }: { member: TeamMember; actingRole: UserRole }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const isAdmin = actingRole === "admin";
  const isLeader = actingRole === "leader";

  if (!isAdmin && !isLeader) {
    return null;
  }

  function handleApprove() {
    startTransition(async () => {
      const result = await approveMember(member.id);
      if (result.error) toast.error(result.error);
      else toast.success(`${member.fullName ?? member.email}님을 승인했습니다.`);
    });
  }

  function handleDeactivate() {
    startTransition(async () => {
      const result = await deactivateMember(member.id);
      if (result.error) toast.error(result.error);
      else toast.success(`${member.fullName ?? member.email}님을 비활성화했습니다.`);
      setDeactivateOpen(false);
    });
  }

  function handleReactivate() {
    startTransition(async () => {
      const result = await reactivateMember(member.id);
      if (result.error) toast.error(result.error);
      else toast.success(`${member.fullName ?? member.email}님을 다시 활성화했습니다.`);
    });
  }

  function handleAssignTreasurer() {
    startTransition(async () => {
      const result = await assignTreasurer(member.id);
      if (result.error) toast.error(result.error);
      else toast.success(`${member.fullName ?? member.email}님을 재무 담당자로 지정했습니다.`);
    });
  }

  function handleRemoveTreasurer() {
    startTransition(async () => {
      const result = await removeTreasurer(member.id);
      if (result.error) toast.error(result.error);
      else toast.success(`${member.fullName ?? member.email}님의 재무 담당자 지정을 해제했습니다.`);
    });
  }

  function handleAssignTeamLeader() {
    startTransition(async () => {
      const result = await assignTeamLeader(member.id);
      if (result.error) toast.error(result.error);
      else toast.success(`${member.fullName ?? member.email}님을 Team Leader로 지정했습니다.`);
    });
  }

  function handleRemoveTeamLeader() {
    startTransition(async () => {
      const result = await removeTeamLeader(member.id);
      if (result.error) toast.error(result.error);
      else toast.success(`${member.fullName ?? member.email}님의 Team Leader 지정을 해제했습니다.`);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-md hover:bg-muted">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">작업</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>수정</DropdownMenuItem>
          {isAdmin && member.status === "pending" ? (
            <DropdownMenuItem onClick={handleApprove} disabled={pending}>
              승인
            </DropdownMenuItem>
          ) : null}
          {isAdmin && member.status === "inactive" ? (
            <DropdownMenuItem onClick={handleReactivate} disabled={pending}>
              재활성화
            </DropdownMenuItem>
          ) : null}
          {isAdmin && member.status === "active" && !member.isTreasurer ? (
            <DropdownMenuItem onClick={handleAssignTreasurer} disabled={pending}>
              재무 담당자로 지정
            </DropdownMenuItem>
          ) : null}
          {isAdmin && member.isTreasurer ? (
            <DropdownMenuItem onClick={handleRemoveTreasurer} disabled={pending}>
              재무 담당자 해제
            </DropdownMenuItem>
          ) : null}
          {isAdmin && member.status === "active" && !member.isTeamLeader ? (
            <DropdownMenuItem onClick={handleAssignTeamLeader} disabled={pending}>
              Team Leader로 지정
            </DropdownMenuItem>
          ) : null}
          {isAdmin && member.isTeamLeader ? (
            <DropdownMenuItem onClick={handleRemoveTeamLeader} disabled={pending}>
              Team Leader 해제
            </DropdownMenuItem>
          ) : null}
          {isAdmin && member.status !== "inactive" ? (
            <DropdownMenuItem variant="destructive" onClick={() => setDeactivateOpen(true)}>
              삭제(비활성화)
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <MemberEditSheet member={member} open={editOpen} onOpenChange={setEditOpen} canEditRoleAndDepartment={isAdmin} />

      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{member.fullName ?? member.email}님을 비활성화할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              비활성화된 팀원은 로그인해도 대시보드를 이용할 수 없게 됩니다. 나중에 다시 활성화할 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} disabled={pending}>
              비활성화
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
