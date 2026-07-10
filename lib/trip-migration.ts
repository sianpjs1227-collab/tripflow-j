import {
  deleteTripDetailData,
  loadTripDetailData,
  saveTripDetailData,
} from "@/lib/trip-detail-storage";
import {
  deleteMyMapsLink,
  hydrateTripMyMapsFromLegacyStorage,
  loadMyMapsConnection,
  saveMyMapsConnection,
} from "@/lib/trip-maps";
import type { Trip } from "@/types/trip";

/** 마이그레이션 시 tripId 변경 — 상세·My Maps localStorage 키 유지 */
export function remapTripLocalReferences(
  oldTripId: string,
  newTripId: string,
): void {
  if (oldTripId === newTripId) return;

  const detail = loadTripDetailData(oldTripId);
  const hasDetail =
    detail.places.length > 0 ||
    detail.events.length > 0 ||
    detail.expenses.length > 0 ||
    detail.checklist.length > 0 ||
    detail.notes.length > 0;

  if (hasDetail) {
    saveTripDetailData(newTripId, detail);
    deleteTripDetailData(oldTripId);
  }

  const myMaps = loadMyMapsConnection(oldTripId);
  if (myMaps) {
    saveMyMapsConnection(newTripId, myMaps);
    deleteMyMapsLink(oldTripId);
  }
}

/** LocalStorage 여행을 Supabase용 UUID id로 변환 */
export function assignUuidToTripForMigration(trip: Trip): Trip {
  const hydrated = hydrateTripMyMapsFromLegacyStorage(trip);
  const newId = crypto.randomUUID();
  remapTripLocalReferences(trip.id, newId);
  return { ...hydrated, id: newId };
}
