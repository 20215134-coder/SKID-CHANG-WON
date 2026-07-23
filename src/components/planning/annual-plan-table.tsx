import Link from "next/link";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnnualPlanRowActions } from "@/components/planning/annual-plan-row-actions";
import { AnnualPlanStatusBadge } from "@/components/planning/annual-plan-status-badge";
import type { AnnualPlan } from "@/services/annual-plan-service";

export function AnnualPlanTable({
  plans,
  canManage,
  canDelete,
}: {
  plans: AnnualPlan[];
  canManage: boolean;
  canDelete: boolean;
}) {
  if (plans.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">등록된 연간 계획이 없습니다.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>시즌</TableHead>
          <TableHead>제목</TableHead>
          <TableHead>기간</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>작성자</TableHead>
          {canManage ? <TableHead className="text-right">작업</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell className="font-medium">{plan.season}</TableCell>
            <TableCell>
              <Link href={`/dashboard/planning/${plan.id}`} className="hover:underline">
                {plan.title}
              </Link>
            </TableCell>
            <TableCell>
              {plan.startDate} ~ {plan.endDate}
            </TableCell>
            <TableCell>
              <AnnualPlanStatusBadge status={plan.status} />
            </TableCell>
            <TableCell>{plan.createdByName ?? "-"}</TableCell>
            {canManage ? (
              <TableCell className="text-right">
                <AnnualPlanRowActions plan={plan} canDelete={canDelete} />
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
