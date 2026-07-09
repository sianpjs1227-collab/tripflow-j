import { unzipSync } from "fflate";

export interface KmzExtractDiagnostics {
  kmlText: string;
  isPlainKml: boolean;
  unzipSuccess: boolean;
  hasDocKml: boolean;
  kmlPath: string | null;
  archiveEntries: string[];
}

/** KMZ 버퍼 또는 KML 텍스트에서 KML 문자열 추출 */
export function extractKmlFromKmzBuffer(buffer: ArrayBuffer): string {
  return extractKmlFromKmzBufferWithDiagnostics(buffer).kmlText;
}

/** KMZ/KML 추출 + 진단 정보 */
export function extractKmlFromKmzBufferWithDiagnostics(
  buffer: ArrayBuffer,
): KmzExtractDiagnostics {
  const data = new Uint8Array(buffer);
  const decoder = new TextDecoder("utf-8");
  const head = decoder.decode(data.slice(0, 200)).trimStart();

  if (head.startsWith("<?xml") || head.toLowerCase().startsWith("<kml")) {
    return {
      kmlText: decoder.decode(data),
      isPlainKml: true,
      unzipSuccess: false,
      hasDocKml: true,
      kmlPath: "(plain-kml)",
      archiveEntries: [],
    };
  }

  if (data[0] !== 0x50 || data[1] !== 0x4b) {
    throw new Error("KML 또는 KMZ 형식이 아닙니다. (ZIP/PK 시그니처 없음)");
  }

  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(data);
  } catch (error) {
    throw new Error(
      `KMZ 압축 해제 실패: ${error instanceof Error ? error.message : "unknown"}`,
    );
  }

  const archiveEntries = Object.keys(unzipped);
  const docKmlPath = archiveEntries.find((path) =>
    path.toLowerCase().endsWith("doc.kml"),
  );
  const kmlPath =
    docKmlPath ??
    archiveEntries.find((path) => path.toLowerCase().endsWith(".kml")) ??
    null;

  if (!kmlPath) {
    throw new Error(
      `KMZ에 KML 파일이 없습니다. (압축 내 파일: ${archiveEntries.join(", ") || "없음"})`,
    );
  }

  return {
    kmlText: decoder.decode(unzipped[kmlPath]),
    isPlainKml: false,
    unzipSuccess: true,
    hasDocKml: Boolean(docKmlPath),
    kmlPath,
    archiveEntries,
  };
}
