import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MilestoneRowActions } from "@/components/planning/milestone-row-actions";
import { MilestoneStatusBadge } from "@/components/planning/milestone-status-badge";
import type { Milestone } from "@/services/milestone-service";

export function MilestoneTable({ milestones, canManage }: { milestones: Milestone[]; canManage: boolean }) {
  if (milestones.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">등록된 마일스톤이 없습니다.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>제목</TableHead>
          <TableHead>설명</TableHead>
          <TableHead>마감일</TableHead>
          <TableHead>상태</TableHead>
          {canManage ? <TableHead className="text-right">작업</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {milestones.map((milestone) => (
          <TableRow key={milestone.id}>
            <TableCell className="font-medium">{milestone.title}</TableCell>
            <TableCell className="max-w-64 truncate text-muted-foreground">{milestone.description ?? "-"}</TableCell>
            <TableCell>{milestone.dueDate}</TableCell>
            <TableCell>
              <MilestoneStatusBadge status={milestone.status} />
            </TableCell>
            {canManage ? (
              <TableCell className="text-right">
                <MilestoneRowActions milestone={milestone} />
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
