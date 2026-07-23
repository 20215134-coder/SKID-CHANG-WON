import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { canManagePurchasing } from "@/lib/purchasing/permissions";
import { BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { formatCurrency } from "@/lib/purchasing/format";
import { getPurchaseFileDownloadUrl } from "@/features/purchasing/actions";
import { getPurchaseRequest, listPurchaseRequestFiles, listPurchaseTimeline } from "@/services/purchase-service";
import { listBomPartOptions } from "@/services/bom-service";
import { listActiveMemberOptions } from "@/services/team-service";
import { AddToInventoryButton } from "@/components/purchasing/add-to-inventory-button";
import { ApproveButton } from "@/components/purchasing/approve-button";
import { CancelPurchaseButton } from "@/components/purchasing/cancel-purchase-button";
import { CompletePurchaseButton } from "@/components/purchasing/complete-purchase-button";
import { RegisterAsAssetButton } from "@/components/purchasing/register-as-asset-button";
import { DownloadFileButton } from "@/components/files/download-file-button";
import { EditPurchaseRequestButton } from "@/components/purchasing/edit-purchase-request-button";
import { EditReceiptButton } from "@/components/purchasing/edit-receipt-button";
import { PurchaseAttachmentsSection } from "@/components/purchasing/purchase-attachments-section";
import { PurchasePriorityBadge } from "@/components/purchasing/purchase-priority-badge";
import { PurchaseStatusBadge } from "@/components/purchasing/purchase-status-badge";
import { PurchaseTimelineView } from "@/components/purchasing/purchase-timeline-view";
import { RejectButton } from "@/components/purchasing/reject-button";
import { SubmitPurchaseButton } from "@/components/purchasing/submit-purchase-button";
import { Card, CardContent } from "@/components/ui/card";
import { VehicleBreadcrumb } from "@/components/vehicle/vehicle-breadcrumb";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const request = await getPurchaseRequest(id);
  return { title: `${request?.requestNumber ?? "구매 요청"} | FSAE ERP` };
}

export default async function PurchaseRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireUser();
  const { id } = await params;

  const request = await getPurchaseRequest(id);
  if (!request) notFound();

  const [timeline, files, partOptions, memberOptions] = await Promise.all([
    listPurchaseTimeline(id),
    listPurchaseRequestFiles(id),
    listBomPartOptions(),
    listActiveMemberOptions(),
  ]);

  const manages = canManagePurchasing(profile);
  const isOwner = request.requestedById === profile.id;

  const canEdit = isOwner && request.status === "draft";
  const canSubmit = isOwner && request.status === "draft";
  const canApproveReject = manages && request.status === "pending_approval";
  const canComplete = manages && request.status === "approved";
  const canCancel =
    (isOwner && ["draft", "pending_approval"].includes(request.status)) ||
    (manages && ["draft", "pending_approval", "approved"].includes(request.status));
  const canManageAttachments = isOwner || manages;
  const canRegister = manages && request.status === "purchased";

  return (
    <div className="flex flex-col gap-4">
      <VehicleBreadcrumb items={[{ label: "Purchasing", href: "/dashboard/purchasing" }, { label: request.requestNumber }]} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{request.title}</h2>
          <p className="text-sm text-muted-foreground">{request.requestNumber}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit ? <EditPurchaseRequestButton request={request} /> : null}
          {canSubmit ? <SubmitPurchaseButton id={request.id} /> : null}
          {canApproveReject ? <ApproveButton id={request.id} /> : null}
          {canApproveReject ? <RejectButton id={request.id} /> : null}
          {canComplete ? <CompletePurchaseButton id={request.id} /> : null}
          {canRegister ? <AddToInventoryButton request={request} partOptions={partOptions} /> : null}
          {canRegister ? <RegisterAsAssetButton request={request} memberOptions={memberOptions} /> : null}
          {canCancel ? <CancelPurchaseButton id={request.id} /> : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <PurchaseStatusBadge status={request.status} />
        <PurchasePriorityBadge priority={request.priority} />
      </div>

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Vehicle</p>
            <p className="text-sm">{request.vehicleName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Engineering Category</p>
            <p className="text-sm">{BOM_CATEGORY_LABELS[request.categoryName]}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Subsystem</p>
            <p className="text-sm">{request.subsystemName ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Assembly / Part</p>
            <p className="text-sm">
              {request.assemblyName ?? "-"}
              {request.partName ? ` / ${request.partName}` : ""}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Supplier</p>
            <p className="text-sm">{request.supplier ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">제품 URL</p>
            {request.productUrl ? (
              <a href={request.productUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                {request.productUrl}
              </a>
            ) : (
              <p className="text-sm">-</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">수량</p>
            <p className="text-sm">{request.quantity}개</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">예상 비용 / 최종 비용</p>
            <p className="text-sm">
              {formatCurrency(request.estimatedCost)} / {formatCurrency(request.finalCost)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">요청자</p>
            <p className="text-sm">{request.requestedByName ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Treasurer</p>
            <p className="text-sm">{request.purchasedByName ?? request.approvedByName ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">구매일</p>
            <p className="text-sm">{request.purchasedAt ? new Date(request.purchasedAt).toLocaleDateString("ko-KR") : "-"}</p>
          </div>
          {request.receiptFile ? (
            <div>
              <p className="mb-1 text-xs text-muted-foreground">영수증</p>
              <div className="flex items-center">
                <DownloadFileButton path={request.receiptFile} fileName="영수증" getUrl={getPurchaseFileDownloadUrl} />
                {manages ? <EditReceiptButton id={request.id} /> : null}
              </div>
            </div>
          ) : null}
          {request.description ? (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">설명</p>
              <p className="text-sm whitespace-pre-wrap">{request.description}</p>
            </div>
          ) : null}
          {request.purchaseNotes ? (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">구매 메모</p>
              <p className="text-sm whitespace-pre-wrap">{request.purchaseNotes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <PurchaseAttachmentsSection purchaseRequestId={request.id} files={files} canManage={canManageAttachments} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3 className="mb-3 text-sm font-semibold">타임라인</h3>
          <PurchaseTimelineView entries={timeline} />
        </CardContent>
      </Card>
    </div>
  );
}
