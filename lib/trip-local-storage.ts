import { normalizeTrip } from "@/lib/trip-utils";
import type { Trip } from "@/types/trip";

const STORAGE_KEY = "tripflow-trips";

/** 더 이상 사용하지 않는 샘플 여행 ID */
const SAMPLE_TRIP_IDS = new Set([
  "trip-fukuoka",
  "trip-tokyo",
  "trip-osaka",
]);

/** localStorage에서 여행 목록 로드 */
export function loadTripsFromLocalStorage(): Trip[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as Trip[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((trip) => !SAMPLE_TRIP_IDS.has(trip.id))
      .map((trip) => normalizeTrip(trip));
  } catch {
    return [];
  }
}

/** localStorage에 여행 목록 저장 */
export function saveTripsToLocalStorage(trips: Trip[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch {
    // 저장 실패 시 무시
  }
}

export { STORAGE_KEY };
