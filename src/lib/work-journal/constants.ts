import { extractFileExtension } from "@/lib/files/extension";

export { extractFileExtension };

const WORK_JOURNAL_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "mp4",
  "mov",
  "step",
  "stp",
  "sldprt",
  "sldasm",
  "pdf",
  "dxf",
  "dwg",
  "zip",
]);

export const WORK_JOURNAL_FILE_ACCEPT = Array.from(WORK_JOURNAL_EXTENSIONS)
  .map((ext) => `.${ext}`)
  .join(",");

export function isAllowedWorkJournalFile(fileName: string): boolean {
  return WORK_JOURNAL_EXTENSIONS.has(extractFileExtension(fileName));
}
