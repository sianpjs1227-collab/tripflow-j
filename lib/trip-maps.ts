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

/** localStorage에서 My Maps 링크 불러오기 */
export function loadMyMapsLink(tripId: string): string {
  if (typeof window === "undefined") return "";

  try {
    return localStorage.getItem(getMyMapsStorageKey(tripId)) ?? "";
  } catch {
    return "";
  }
}

/** localStorage에 My Maps 링크 저장 */
export function saveMyMapsLink(tripId: string, url: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(getMyMapsStorageKey(tripId), url);
  } catch {
    // 저장 실패 시 무시
  }
}

/** localStorage에서 My Maps 링크 삭제 */
export function deleteMyMapsLink(tripId: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(getMyMapsStorageKey(tripId));
  } catch {
    // 삭제 실패 시 무시
  }
}
