"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Trip } from "@/types/trip";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTripHomeStats,
  getTripHomeStatsAsync,
  type TripHomeStats,
} from "@/lib/trip-home-utils";
import {
  getTripDetailRevision,
  subscribeTripDetailUpdates,
} from "@/lib/trip-detail-events";

/**
 * 홈 여행카드 통계
 * — 즉시 localStorage, 이후 Supabase+local merge로 장소 탭과 동기화
 */
export function useTripHomeStats(trip: Trip): TripHomeStats {
  const { mode: authMode, user, loading: authLoading } = useAuth();
  const revision = useSyncExternalStore(
    (onStoreChange) => subscribeTripDetailUpdates(trip.id, onStoreChange),
    () => getTripDetailRevision(trip.id),
    () => 0,
  );

  const localStats = useMemo(() => getTripHomeStats(trip), [trip, revision]);
  const [stats, setStats] = useState<TripHomeStats>(localStats);

  useEffect(() => {
    setStats(localStats);
  }, [localStats]);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    const useSupabase = authMode === "supabase" && user != null;

    void getTripHomeStatsAsync(trip, { useSupabase }).then((next) => {
      if (!cancelled) setStats(next);
    });

    return () => {
      cancelled = true;
    };
  }, [trip, revision, authMode, user, authLoading]);

  return stats;
}
