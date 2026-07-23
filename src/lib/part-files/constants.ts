export type PartFileCategory = "cad" | "drawing" | "image";

// 확장자 -> 분류. 분류는 아이콘 선택과 업로드 시 허용 여부 검증에 사용한다.
export const PART_FILE_EXTENSIONS: Record<string, PartFileCategory> = {
  sldprt: "cad",
  sldasm: "cad",
  step: "cad",
  stp: "cad",
  igs: "cad",
  iges: "cad",
  pdf: "drawing",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
};

export const PART_FILE_ACCEPT = Object.keys(PART_FILE_EXTENSIONS)
  .map((ext) => `.${ext}`)
  .join(",");

export function extractFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}

export function getPartFileCategory(fileType: string): PartFileCategory | null {
  return PART_FILE_EXTENSIONS[fileType.toLowerCase()] ?? null;
}

export function isAllowedPartFile(fileName: string): boolean {
  return extractFileExtension(fileName) in PART_FILE_EXTENSIONS;
}
