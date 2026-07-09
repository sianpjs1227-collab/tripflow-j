import type { MyMapsConnection } from "@/types/mymaps";

/** Google Maps URL 정규화 */
export function normalizeMapsUrl(url: string): string {
  const trimmed = url.trim();
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

/** 새 탭에서 URL 열기 */
export function openMapsUrl(url: string): void {
  window.open(normalizeMapsUrl(url), "_blank", "noopener,noreferrer");
}

const MY_MAPS_STORAGE_PREFIX = "tripflow-mymaps-";

/** 여행별 My Maps localStorage 키 */
export function getMyMapsStorageKey(tripId: string): string {
  return `${MY_MAPS_STORAGE_PREFIX}${tripId}`;
}

/** 공유 링크에서 map id(mid) 추출 */
export function extractMapIdFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const midMatch = trimmed.match(/[?&]mid=([A-Za-z0-9_-]+)/i);
  return midMatch?.[1] ?? null;
}

/** My Maps 뷰어 URL 생성 */
export function buildMyMapsViewerUrl(mapId: string): string {
  return `https://www.google.com/maps/d/viewer?mid=${encodeURIComponent(mapId)}`;
}

/** My Maps KML 다운로드 URL */
export function buildMyMapsKmlUrl(mapId: string): string {
  return `https://www.google.com/maps/d/kml?mid=${encodeURIComponent(mapId)}`;
}

function parseStoredConnection(raw: string): MyMapsConnection | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as MyMapsConnection;
      if (parsed.mapId?.trim()) {
        return {
          mapId: parsed.mapId.trim(),
          viewerUrl: parsed.viewerUrl || buildMyMapsViewerUrl(parsed.mapId),
          lastSyncAt: parsed.lastSyncAt,
          lastSyncResult: parsed.lastSyncResult,
        };
      }
    } catch {
      // legacy URL fallback
    }
  }

  const mapId = extractMapIdFromUrl(trimmed);
  if (!mapId) return null;

  return {
    mapId,
    viewerUrl: normalizeMapsUrl(trimmed),
  };
}

/** My Maps 연결 정보 불러오기 */
export function loadMyMapsConnection(tripId: string): MyMapsConnection | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(getMyMapsStorageKey(tripId)) ?? "";
    return parseStoredConnection(raw);
  } catch {
    return null;
  }
}

/** My Maps 연결 정보 저장 */
export function saveMyMapsConnection(
  tripId: string,
  connection: MyMapsConnection,
): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      getMyMapsStorageKey(tripId),
      JSON.stringify(connection),
    );
  } catch {
    // 저장 실패 시 무시
  }
}

/** 공유 링크 저장 — mid 자동 추출 */
export function saveMyMapsLink(tripId: string, url: string): MyMapsConnection | null {
  const mapId = extractMapIdFromUrl(url);
  if (!mapId) return null;

  const existing = loadMyMapsConnection(tripId);
  const connection: MyMapsConnection = {
    mapId,
    viewerUrl: normalizeMapsUrl(url),
    lastSyncAt: existing?.lastSyncAt,
    lastSyncResult: existing?.lastSyncResult,
  };

  saveMyMapsConnection(tripId, connection);
  return connection;
}

/** 뷰어 URL (레거시 호환) */
export function loadMyMapsLink(tripId: string): string {
  return loadMyMapsConnection(tripId)?.viewerUrl ?? "";
}

export function isMyMapsConnected(tripId: string): boolean {
  return Boolean(loadMyMapsConnection(tripId)?.mapId);
}

/** localStorage에서 My Maps 연결 삭제 */
export function deleteMyMapsLink(tripId: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(getMyMapsStorageKey(tripId));
  } catch {
    // 삭제 실패 시 무시
  }
}

/** 마지막 동기화 시각 표시 */
export function formatLastSyncTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  if (date.toDateString() === now.toDateString()) {
    return `오늘 ${hours}:${minutes}`;
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day} ${hours}:${minutes}`;
}
