import { extractFileExtension } from "@/lib/files/extension";

export { extractFileExtension };

const DESIGN_JOURNAL_EXTENSIONS = new Set([
  "step",
  "stp",
  "sldprt",
  "sldasm",
  "pdf",
  "dxf",
  "dwg",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "zip",
]);

export const DESIGN_JOURNAL_FILE_ACCEPT = Array.from(DESIGN_JOURNAL_EXTENSIONS)
  .map((ext) => `.${ext}`)
  .join(",");

export function isAllowedDesignJournalFile(fileName: string): boolean {
  return DESIGN_JOURNAL_EXTENSIONS.has(extractFileExtension(fileName));
}
