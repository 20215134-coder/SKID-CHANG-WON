import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

import { requireUser } from "@/lib/auth/require-user";
import { getVehicleCostReport } from "@/services/cost-report-service";

const CURRENCY_FORMAT = "#,##0";

export async function GET(_request: Request, { params }: { params: Promise<{ vehicleId: string }> }) {
  await requireUser();
  const { vehicleId } = await params;

  const report = await getVehicleCostReport(vehicleId);
  if (!report) {
    return NextResponse.json({ error: "차량을 찾을 수 없습니다." }, { status: 404 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SKID";
  workbook.created = new Date();

  // ── 종합 ──
  const summarySheet = workbook.addWorksheet("종합");
  summarySheet.columns = [{ width: 6 }, { width: 24 }, { width: 18 }];

  summarySheet.mergeCells("A1:C1");
  summarySheet.getCell("A1").value = "비용보고서(원가명세표) - 종합";
  summarySheet.getCell("A1").font = { bold: true, size: 14 };

  summarySheet.getCell("A3").value = "시즌";
  summarySheet.getCell("B3").value = report.competitionYear;
  summarySheet.getCell("A4").value = "차량명";
  summarySheet.getCell("B4").value = report.vehicleName;
  summarySheet.getCell("A5").value = "차량제작비";
  summarySheet.getCell("B5").value = report.totalCost;
  summarySheet.getCell("B5").numFmt = CURRENCY_FORMAT;
  summarySheet.getCell("A5").font = { bold: true };
  summarySheet.getCell("B5").font = { bold: true };

  const summaryHeaderRow = summarySheet.getRow(7);
  summaryHeaderRow.values = ["연번", "구분", "금액"];
  summaryHeaderRow.font = { bold: true };

  report.categorySummaries.forEach((summary, index) => {
    const row = summarySheet.getRow(8 + index);
    row.values = [index + 1, summary.categoryLabel, summary.total];
    row.getCell(3).numFmt = CURRENCY_FORMAT;
  });

  const totalRow = summarySheet.getRow(8 + report.categorySummaries.length);
  totalRow.values = ["", "합계", report.totalCost];
  totalRow.font = { bold: true };
  totalRow.getCell(3).numFmt = CURRENCY_FORMAT;

  // ── 원가명세표 ──
  const detailSheet = workbook.addWorksheet("원가명세표");
  detailSheet.columns = [
    { header: "연번", key: "no", width: 6 },
    { header: "구분", key: "category", width: 14 },
    { header: "Subsystem", key: "subsystem", width: 16 },
    { header: "Assembly", key: "assembly", width: 20 },
    { header: "제품명", key: "item", width: 28 },
    { header: "구매처", key: "supplier", width: 16 },
    { header: "단가", key: "unitCost", width: 12 },
    { header: "수량", key: "quantity", width: 8 },
    { header: "합계", key: "total", width: 14 },
  ];
  detailSheet.getRow(1).font = { bold: true };

  for (const line of report.lines) {
    const row = detailSheet.addRow({
      no: line.no,
      category: line.categoryLabel,
      subsystem: line.subsystemName,
      assembly: line.assemblyName,
      item: line.itemName,
      supplier: line.supplier ?? "",
      unitCost: line.unitCost,
      quantity: line.quantity,
      total: line.total,
    });
    row.getCell("unitCost").numFmt = CURRENCY_FORMAT;
    row.getCell("total").numFmt = CURRENCY_FORMAT;
  }

  const detailTotalRow = detailSheet.addRow({ item: "합계", total: report.totalCost });
  detailTotalRow.font = { bold: true };
  detailTotalRow.getCell("total").numFmt = CURRENCY_FORMAT;

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `비용보고서_${report.competitionYear}_${report.vehicleName}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="cost-report.xlsx"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  });
}
