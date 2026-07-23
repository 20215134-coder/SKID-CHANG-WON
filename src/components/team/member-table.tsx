import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DepartmentBadge } from "@/components/team/department-badge";
import { MemberRowActions } from "@/components/team/member-row-actions";
import { RoleBadge } from "@/components/team/role-badge";
import { StatusBadge } from "@/components/team/status-badge";
import type { TeamMember } from "@/services/team-service";
import type { UserRole } from "@/types/database.types";

export function MemberTable({ members, actingRole }: { members: TeamMember[]; actingRole: UserRole }) {
  if (members.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">조건에 맞는 팀원이 없습니다.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>학번</TableHead>
          <TableHead>부서</TableHead>
          <TableHead>권한</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>연락처</TableHead>
          <TableHead>가입일</TableHead>
          <TableHead className="text-right">작업</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="font-medium">{member.fullName ?? "이름 미등록"}</TableCell>
            <TableCell>{member.studentId ?? "-"}</TableCell>
            <TableCell>
              <DepartmentBadge department={member.department} />
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                <RoleBadge role={member.role} />
                {member.isTreasurer ? <Badge variant="outline">Treasurer</Badge> : null}
                {member.isTeamLeader ? <Badge variant="outline">Team Leader</Badge> : null}
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status={member.status} />
            </TableCell>
            <TableCell>{member.phone ?? "-"}</TableCell>
            <TableCell>{member.joinedAt}</TableCell>
            <TableCell className="text-right">
              <MemberRowActions member={member} actingRole={actingRole} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
