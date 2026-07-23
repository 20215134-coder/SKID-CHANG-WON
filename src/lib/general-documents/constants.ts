import { extractFileExtension } from "@/lib/files/extension";
import type { DocumentCategory } from "@/types/database.types";

export { extractFileExtension };

export const DOCUMENT_CATEGORIES: DocumentCategory[] = ["rules", "design_report", "cost_report", "ses", "team_documents", "other"];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  rules: "Rules",
  design_report: "Design Report",
  cost_report: "Cost Report",
  ses: "SES",
  team_documents: "Team Documents",
  other: "기타",
};

const DOCUMENT_EXTENSIONS = new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "png", "jpg", "jpeg", "webp"]);

export const DOCUMENT_FILE_ACCEPT = Array.from(DOCUMENT_EXTENSIONS)
  .map((ext) => `.${ext}`)
  .join(",");

export function isAllowedDocumentFile(fileName: string): boolean {
  return DOCUMENT_EXTENSIONS.has(extractFileExtension(fileName));
}
