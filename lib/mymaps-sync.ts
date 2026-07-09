import type { Place } from "@/types/place";
import type { MyMapsSyncResult } from "@/types/mymaps";
import type { KmlImportResult } from "@/types/kml";
import { syncKmlPlacemarksIntoPlaces } from "@/lib/kml-import";
import { extractKmlFromKmzBufferWithDiagnostics } from "@/lib/kmz-utils";
import { parseKmlPlacemarks } from "@/lib/kml-parser";
import {
  errorMyMapsSyncStep,
  logMyMapsSyncStep,
  toMyMapsSyncErrorMessage,
} from "@/lib/mymaps-sync-log";
import { buildMyMapsKmlUrl } from "@/lib/trip-maps";

export interface MyMapsSyncPipelineInput {
  shareLink: string;
  mapId: string;
  existingPlaces: Place[];
}

export interface MyMapsSyncPipelineResult {
  importResult: KmlImportResult;
  placemarkCount: number;
  syncResult: MyMapsSyncResult;
}

/**
 * My Maps 동기화 전체 파이프라인 — STEP 1~10 단계별 console.log
 */
export async function runMyMapsSyncPipeline(
  input: MyMapsSyncPipelineInput,
): Promise<MyMapsSyncPipelineResult> {
  const { shareLink, mapId, existingPlaces } = input;
  let currentStep = 0;

  try {
    currentStep = 1;
    const trimmedShareLink = shareLink.trim();
    if (!trimmedShareLink) {
      throw new Error("공유 링크가 비어 있습니다.");
    }
    logMyMapsSyncStep(1, "공유 링크 파싱 완료", { shareLink: trimmedShareLink });

    currentStep = 2;
    const trimmedMapId = mapId.trim();
    if (!trimmedMapId) {
      throw new Error("mid가 비어 있습니다.");
    }
    logMyMapsSyncStep(2, "mid 추출 완료", { mapId: trimmedMapId });

    currentStep = 3;
    const kmlUrl = buildMyMapsKmlUrl(trimmedMapId);
    const proxyUrl = `/api/mymaps/kml?mid=${encodeURIComponent(trimmedMapId)}`;
    const response = await fetch(proxyUrl);
    logMyMapsSyncStep(3, "API 호출 완료", {
      proxyUrl,
      kmlUrl,
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}: My Maps 데이터를 가져올 수 없습니다.`;
      try {
        const body = (await response.json()) as {
          error?: string;
          stack?: string;
          googleBody?: string;
        };
        if (body.error) message = `HTTP ${response.status}: ${body.error}`;
        if (body.stack) {
          console.error("[TripFlow MyMaps Sync] API Route stack", body.stack);
        }
        if (body.googleBody) {
          console.error("[TripFlow MyMaps Sync] API Route googleBody", body.googleBody);
        }
      } catch {
        // ignore JSON parse failure
      }
      throw new Error(message);
    }

    currentStep = 4;
    const contentType = response.headers.get("content-type");
    const buffer = await response.arrayBuffer();
    logMyMapsSyncStep(4, "KMZ 수신 완료", {
      bytes: buffer.byteLength,
      contentType: contentType ?? "(없음)",
    });

    if (buffer.byteLength === 0) {
      throw new Error("다운로드된 파일이 비어 있습니다. (0 bytes)");
    }

    currentStep = 5;
    const extract = extractKmlFromKmzBufferWithDiagnostics(buffer);
    logMyMapsSyncStep(5, "JSZip 압축 해제 완료", {
      unzipSuccess: extract.unzipSuccess,
      isPlainKml: extract.isPlainKml,
      archiveEntries: extract.archiveEntries,
    });

    currentStep = 6;
    if (!extract.kmlText.trim()) {
      throw new Error("doc.kml 내용이 비어 있습니다.");
    }
    logMyMapsSyncStep(6, "doc.kml 찾기 완료", {
      hasDocKml: extract.hasDocKml,
      kmlPath: extract.kmlPath,
    });

    currentStep = 7;
    const { placemarks, errors } = parseKmlPlacemarks(extract.kmlText);
    logMyMapsSyncStep(7, "XML 파싱 완료", {
      parseErrors: errors,
    });

    if (errors.length > 0 && placemarks.length === 0) {
      throw new Error(errors[0] ?? "KML에서 Placemark를 파싱할 수 없습니다.");
    }

    currentStep = 8;
    logMyMapsSyncStep(8, "Placemark 개수 출력", { count: placemarks.length });

    currentStep = 9;
    const importResult = syncKmlPlacemarksIntoPlaces(existingPlaces, placemarks);
    logMyMapsSyncStep(9, "Places 변환 완료", {
      addedCount: importResult.addedCount,
      updatedCount: importResult.updatedCount ?? 0,
      deletedCount: importResult.deletedCount ?? 0,
      totalPlaces: importResult.places.length,
    });

    const syncResult: MyMapsSyncResult = {
      addedCount: importResult.addedCount,
      updatedCount: importResult.updatedCount ?? 0,
      deletedCount: importResult.deletedCount ?? 0,
    };

    currentStep = 10;
    logMyMapsSyncStep(10, "저장 완료", {
      addedCount: syncResult.addedCount,
      updatedCount: syncResult.updatedCount,
      deletedCount: syncResult.deletedCount,
      placemarkCount: placemarks.length,
    });

    return {
      importResult,
      placemarkCount: placemarks.length,
      syncResult,
    };
  } catch (error) {
    errorMyMapsSyncStep(currentStep, error);
    throw new Error(toMyMapsSyncErrorMessage(error));
  }
}

/** 동기화 결과 메시지 */
export function formatSyncResultMessage(result: MyMapsSyncResult): string {
  const parts: string[] = [];

  if (result.addedCount > 0) {
    parts.push(`새 장소 +${result.addedCount}`);
  }
  if (result.updatedCount > 0) {
    parts.push(`수정 ${result.updatedCount}`);
  }
  if (result.deletedCount > 0) {
    parts.push(`삭제 ${result.deletedCount}`);
  }

  if (parts.length === 0) return "변경 사항 없음";
  return parts.join(" · ");
}

/** @deprecated runMyMapsSyncPipeline 사용 */
export async function fetchMyMapsPlacemarks(mapId: string) {
  const kmlUrl = buildMyMapsKmlUrl(mapId);
  const proxyUrl = `/api/mymaps/kml?mid=${encodeURIComponent(mapId.trim())}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: My Maps 데이터를 가져올 수 없습니다.`);
  }
  const buffer = await response.arrayBuffer();
  const extract = extractKmlFromKmzBufferWithDiagnostics(buffer);
  return parseKmlPlacemarks(extract.kmlText);
}
