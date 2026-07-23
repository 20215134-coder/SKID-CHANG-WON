import { extractFileExtension } from "@/lib/part-files/constants";
import type { PurchasePriority, PurchaseStatus } from "@/types/database.types";

export const PURCHASE_PRIORITIES: PurchasePriority[] = ["low", "normal", "high", "urgent"];

export const PURCHASE_PRIORITY_LABELS: Record<PurchasePriority, string> = {
  low: "낮음",
  normal: "보통",
  high: "높음",
  urgent: "긴급",
};

export const PURCHASE_STATUSES: PurchaseStatus[] = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "purchased",
  "cancelled",
];

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  draft: "임시 저장",
  pending_approval: "승인 대기",
  approved: "승인됨",
  rejected: "반려됨",
  purchased: "구매 완료",
  cancelled: "취소됨",
};

const ALLOWED_PURCHASE_FILE_EXTENSIONS = ["pdf", "png", "jpg", "jpeg"];

export const PURCHASE_FILE_ACCEPT = ALLOWED_PURCHASE_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export function isAllowedPurchaseFile(fileName: string): boolean {
  return ALLOWED_PURCHASE_FILE_EXTENSIONS.includes(extractFileExtension(fileName));
}
