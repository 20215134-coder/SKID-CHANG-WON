import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteFastenerButton } from "@/components/fasteners/delete-fastener-button";
import { EditFastenerButton } from "@/components/fasteners/edit-fastener-button";
import { formatCurrency } from "@/lib/purchasing/format";
import type { Fastener } from "@/services/fastener-service";

export function FastenerCatalogTable({ fasteners, canManage, canDelete }: { fasteners: Fastener[]; canManage: boolean; canDelete: boolean }) {
  if (fasteners.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">등록된 체결류가 없습니다.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>규격</TableHead>
          <TableHead>단가</TableHead>
          <TableHead>구매처</TableHead>
          {canManage ? <TableHead className="text-right">작업</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {fasteners.map((fastener) => (
          <TableRow key={fastener.id}>
            <TableCell className="font-medium">{fastener.name}</TableCell>
            <TableCell className="text-muted-foreground">{fastener.spec ?? "-"}</TableCell>
            <TableCell className="text-muted-foreground">{formatCurrency(fastener.unitCost)}</TableCell>
            <TableCell className="text-muted-foreground">{fastener.supplier ?? "-"}</TableCell>
            {canManage ? (
              <TableCell className="text-right">
                <div className="flex justify-end">
                  <EditFastenerButton fastener={fastener} />
                  {canDelete ? <DeleteFastenerButton id={fastener.id} name={fastener.name} /> : null}
                </div>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
