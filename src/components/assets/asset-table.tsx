import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryBadge } from "@/components/bom/category-badge";
import { AssetConditionBadge } from "@/components/assets/asset-condition-badge";
import { AssetRowActions } from "@/components/assets/asset-row-actions";
import type { Asset } from "@/services/asset-service";
import type { MemberOption } from "@/services/team-service";

function formatCurrency(amount: number | null): string {
  if (amount === null) return "-";
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function AssetTable({
  assets,
  memberOptions,
  canManage,
  canDelete,
  canSeeValue,
}: {
  assets: Asset[];
  memberOptions: MemberOption[];
  canManage: boolean;
  canDelete: boolean;
  canSeeValue: boolean;
}) {
  if (assets.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">등록된 자산이 없습니다.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>자산 번호</TableHead>
          <TableHead>이름</TableHead>
          <TableHead>분류</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>담당자</TableHead>
          <TableHead>구매일</TableHead>
          {canSeeValue ? <TableHead>구매 비용</TableHead> : null}
          {canManage ? <TableHead className="text-right">작업</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={asset.id}>
            <TableCell className="font-medium">{asset.assetNumber}</TableCell>
            <TableCell>{asset.assetName}</TableCell>
            <TableCell>{asset.engineeringCategory ? <CategoryBadge category={asset.engineeringCategory} /> : <span className="text-muted-foreground">공용</span>}</TableCell>
            <TableCell>
              <AssetConditionBadge condition={asset.currentCondition} />
            </TableCell>
            <TableCell>{asset.assignedToName ?? "-"}</TableCell>
            <TableCell>{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString("ko-KR") : "-"}</TableCell>
            {canSeeValue ? <TableCell>{formatCurrency(asset.purchaseCost)}</TableCell> : null}
            {canManage ? (
              <TableCell className="text-right">
                <AssetRowActions asset={asset} memberOptions={memberOptions} canDelete={canDelete} />
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
