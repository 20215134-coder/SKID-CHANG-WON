import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddAssemblyFastenerButton } from "@/components/fasteners/add-assembly-fastener-button";
import { EditAssemblyFastenerButton } from "@/components/fasteners/edit-assembly-fastener-button";
import { RemoveAssemblyFastenerButton } from "@/components/fasteners/remove-assembly-fastener-button";
import { formatCurrency } from "@/lib/purchasing/format";
import type { AssemblyFastener, FastenerOption } from "@/services/fastener-service";

export function AssemblyFastenersSection({
  assemblyId,
  fasteners,
  fastenerOptions,
  canManage,
}: {
  assemblyId: string;
  fasteners: AssemblyFastener[];
  fastenerOptions: FastenerOption[];
  canManage: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">체결류</h3>
        {canManage ? <AddAssemblyFastenerButton assemblyId={assemblyId} fastenerOptions={fastenerOptions} /> : null}
      </div>

      {fasteners.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">등록된 체결류가 없습니다.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>규격</TableHead>
              <TableHead>수량</TableHead>
              <TableHead>합계</TableHead>
              {canManage ? <TableHead className="text-right">작업</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fasteners.map((fastener) => (
              <TableRow key={fastener.id}>
                <TableCell className="font-medium">{fastener.name}</TableCell>
                <TableCell className="text-muted-foreground">{fastener.spec ?? "-"}</TableCell>
                <TableCell>{fastener.quantity}개</TableCell>
                <TableCell className="text-muted-foreground">
                  {fastener.unitCost !== null ? formatCurrency(fastener.unitCost * fastener.quantity) : "-"}
                </TableCell>
                {canManage ? (
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <EditAssemblyFastenerButton id={fastener.id} name={fastener.name} quantity={fastener.quantity} />
                      <RemoveAssemblyFastenerButton id={fastener.id} name={fastener.name} />
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
