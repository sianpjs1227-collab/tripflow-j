const STORAGE_PREFIX = "tripflow-place-favorites-";

function storageKey(tripId: string): string {
  return `${STORAGE_PREFIX}${tripId}`;
}

/** tripId 기준 즐겨찾기 placeId 목록 불러오기 */
export function loadFavoritePlaceIds(tripId: string): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(storageKey(tripId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** tripId 기준 즐겨찾기 placeId 목록 저장 */
export function saveFavoritePlaceIds(tripId: string, placeIds: string[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(storageKey(tripId), JSON.stringify(placeIds));
  } catch {
    // 저장 실패 시 무시
  }
}
