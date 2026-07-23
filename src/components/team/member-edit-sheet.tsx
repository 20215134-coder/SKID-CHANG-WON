"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { updateMember, type TeamActionState } from "@/features/team/actions";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { BOM_CATEGORIES, BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { TeamMember } from "@/services/team-service";
import type { BomCategory, UserRole } from "@/types/database.types";

const initialState: TeamActionState = {};
const ROLES: UserRole[] = ["admin", "leader", "member"];
type BomCategoryOption = BomCategory | "none";

export function MemberEditSheet({
  member,
  open,
  onOpenChange,
  canEditRoleAndDepartment,
}: {
  member: TeamMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEditRoleAndDepartment: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateMember, initialState);
  const [role, setRole] = useState<UserRole>(member.role);
  const [department, setDepartment] = useState(member.department ?? "");
  const [bomCategory, setBomCategory] = useState<BomCategoryOption>(member.bomCategory ?? "none");

  useEffect(() => {
    if (state.success) {
      toast.success("팀원 정보를 저장했습니다.");
      onOpenChange(false);
    }
  }, [state.success, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>팀원 정보 수정</SheetTitle>
          <SheetDescription>{member.email}</SheetDescription>
        </SheetHeader>
        <form action={formAction} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <input type="hidden" name="id" value={member.id} />
          {canEditRoleAndDepartment ? (
            <>
              <input type="hidden" name="role" value={role} />
              <input type="hidden" name="department" value={department} />
              <input type="hidden" name="bomCategory" value={bomCategory} />
            </>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">이름</Label>
            <Input id="fullName" name="fullName" defaultValue={member.fullName ?? ""} required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="studentId">학번</Label>
            <Input id="studentId" name="studentId" defaultValue={member.studentId ?? ""} required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">연락처</Label>
            <Input id="phone" name="phone" defaultValue={member.phone ?? ""} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="joinedAt">가입일</Label>
            <Input id="joinedAt" name="joinedAt" type="date" defaultValue={member.joinedAt} required />
          </div>

          <div className="flex flex-col gap-2">
            <Label>부서</Label>
            {canEditRoleAndDepartment ? (
              <Input
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                placeholder="예: 파워트레인"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{member.department ?? "미지정"} (관리자만 변경 가능)</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>권한</Label>
            {canEditRoleAndDepartment ? (
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{ROLE_LABELS[member.role]} (관리자만 변경 가능)</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>BOM 담당 카테고리</Label>
            {canEditRoleAndDepartment ? (
              <Select
                value={bomCategory}
                onValueChange={(value) => setBomCategory(value as BomCategoryOption)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">미지정</SelectItem>
                  {BOM_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {BOM_CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                {member.bomCategory ? BOM_CATEGORY_LABELS[member.bomCategory] : "미지정"} (관리자만 변경 가능)
              </p>
            )}
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {pending ? "저장 중..." : "저장"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
