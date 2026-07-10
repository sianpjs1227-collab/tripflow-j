import { useMemo, useSyncExternalStore } from "react";
import type { Trip } from "@/types/trip";
import {
  getTripHomeStats,
  type TripHomeStats,
} from "@/lib/trip-home-utils";
import {
  getTripDetailRevision,
  subscribeTripDetailUpdates,
} from "@/lib/trip-detail-events";

/**
 * 홈 여행카드 통계 — places.length 기준, 상세 데이터 변경 시 즉시 갱신
 */
export function useTripHomeStats(trip: Trip): TripHomeStats {
  const revision = useSyncExternalStore(
    (onStoreChange) => subscribeTripDetailUpdates(trip.id, onStoreChange),
    () => getTripDetailRevision(trip.id),
    () => 0,
  );

  return useMemo(() => getTripHomeStats(trip), [trip, revision]);
}
