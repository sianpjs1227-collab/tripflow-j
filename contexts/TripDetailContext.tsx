"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTrips } from "@/contexts/TripContext";
import { applyPlaceIdRemapping } from "@/lib/place-migration";
import {
  fetchSupabasePlacesByTripId,
  migrateLocalPlacesToSupabase,
  syncSupabasePlacesDiff,
} from "@/lib/supabase-places";
import {
  fetchSupabaseItinerariesByTripId,
  migrateLocalItinerariesToSupabase,
  syncSupabaseItinerariesDiff,
} from "@/lib/supabase-itineraries";
import {
  fetchSupabaseExpensesByTripId,
  migrateLocalExpensesToSupabase,
  syncSupabaseExpensesDiff,
} from "@/lib/supabase-expenses";
import {
  fetchSupabaseChecklistsByTripId,
  migrateLocalChecklistsToSupabase,
  syncSupabaseChecklistsDiff,
} from "@/lib/supabase-checklists";
import {
  fetchSupabaseMemosByTripId,
  migrateLocalMemosToSupabase,
  syncSupabaseMemosDiff,
} from "@/lib/supabase-memos";
import { buildTripDates } from "@/lib/schedule-utils";
import type { TripDetailData } from "@/types/trip-detail";
import { createEmptyTripDetailData } from "@/types/trip-detail";
import type { Place } from "@/types/place";
import type { Event } from "@/types/event";
import {
  loadTripDetailData,
  saveTripDetailData,
  saveTripDetailDataPreservingRemoteFields,
} from "@/lib/trip-detail-storage";
import { getPlaceById, upsertPlace } from "@/lib/place-utils";
import { isUuid } from "@/lib/supabase";

type DetailStorageMode = "local" | "supabase";

interface TripDetailContextValue {
  tripId: string;
  data: TripDetailData;
  hydrated: boolean;
  updateData: (updater: (prev: TripDetailData) => TripDetailData) => void;
  getPlaceById: (placeId: string) => Place | undefined;
}

const TripDetailContext = createContext<TripDetailContextValue | null>(null);

export function TripDetailProvider({
  tripId,
  children,
}: {
  tripId: string;
  children: React.ReactNode;
}) {
  const { mode: authMode, user, loading: authLoading } = useAuth();
  const { getTripById } = useTrips();
  const [data, setData] = useState<TripDetailData>(createEmptyTripDetailData);
  const [hydrated, setHydrated] = useState(false);
  const [detailStorageMode, setDetailStorageMode] =
    useState<DetailStorageMode>("local");
  const detailStorageModeRef = useRef<DetailStorageMode>("local");
  const tripDatesRef = useRef<string[]>([]);

  useEffect(() => {
    detailStorageModeRef.current = detailStorageMode;
  }, [detailStorageMode]);

  const resolveTripDates = useCallback(
    (events: Event[]) => {
      const trip = getTripById(tripId);
      if (trip) {
        return buildTripDates(trip.startDate, trip.endDate);
      }

      return [...new Set(events.map((event) => event.date))].sort();
    },
    [getTripById, tripId],
  );

  const fallbackToLocal = useCallback(
    (message: string) => {
      console.error("[TripFlow Detail]", message);
      setDetailStorageMode("local");
      setData(loadTripDetailData(tripId));
    },
    [tripId],
  );

  const logContextError = useCallback((label: string, error: unknown) => {
    const supabaseError = error as {
      message?: string;
      code?: string;
      details?: string;
    } | null;

    console.error(label, {
      message: supabaseError?.message ?? null,
      code: supabaseError?.code ?? null,
      details: supabaseError?.details ?? null,
    });
  }, []);

  const syncDetailToSupabase = useCallback(
    async (prev: TripDetailData, next: TripDetailData) => {
      if (detailStorageModeRef.current !== "supabase") return;

      try {
        if (prev.places !== next.places) {
          await syncSupabasePlacesDiff(tripId, prev.places, next.places);
        }

        if (prev.events !== next.events) {
          tripDatesRef.current = resolveTripDates(next.events);
          await syncSupabaseItinerariesDiff(
            tripId,
            tripDatesRef.current,
            prev.events,
            next.events,
            next.places,
          );
        }

        if (prev.expenses !== next.expenses || prev.events !== next.events) {
          await syncSupabaseExpensesDiff(
            tripId,
            prev.expenses,
            next.expenses,
            prev.events,
            next.events,
          );
        }

        if (prev.checklist !== next.checklist) {
          await syncSupabaseChecklistsDiff(
            tripId,
            prev.checklist,
            next.checklist,
          );
        }

        if (prev.notes !== next.notes) {
          await syncSupabaseMemosDiff(tripId, prev.notes, next.notes);
        }
      } catch (error) {
        logContextError("[TripFlow Detail] sync error", error);
        const msg =
          error instanceof Error ? error.message : "Supabase 상세 데이터 동기화 실패";
        fallbackToLocal(msg);
      }
    },
    [tripId, fallbackToLocal, logContextError, resolveTripDates],
  );

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function loadDetail() {
      const localData = loadTripDetailData(tripId);
      const useSupabase = authMode === "supabase" && user != null;

      if (!useSupabase) {
        if (!cancelled) {
          tripDatesRef.current = resolveTripDates(localData.events);
          setDetailStorageMode("local");
          setData(localData);
          setHydrated(true);
        }
        return;
      }

      if (!isUuid(tripId)) {
        console.log("[Supabase Query] detail.skip_non_uuid_trip_id", {
          tripId,
          reason:
            "Trip list fell back to localStorage, so this legacy trip id cannot be queried against uuid trip_id columns.",
        });
        if (!cancelled) {
          tripDatesRef.current = resolveTripDates(localData.events);
          setDetailStorageMode("local");
          setData(localData);
          setHydrated(true);
        }
        return;
      }

      try {
        let remotePlaces = await fetchSupabasePlacesByTripId(tripId);
        const localPlaces = localData.places;
        let detailData = localData;

        if (
          remotePlaces.length === 0 &&
          Array.isArray(localPlaces) &&
          localPlaces.length > 0
        ) {
          const { places, idMap } = await migrateLocalPlacesToSupabase(
            tripId,
            localPlaces,
          );
          remotePlaces = places;
          if (Object.keys(idMap).length > 0) {
            detailData = applyPlaceIdRemapping(tripId, localData, idMap);
          }
        } else if (remotePlaces.length > 0) {
          console.log("[Supabase Query] places.migrate.skip", {
            tripId,
            reason: "remote places already loaded",
            remoteCount: remotePlaces.length,
            localCount: localPlaces.length,
          });
        } else {
          console.log("[Supabase Query] places.migrate.skip", {
            tripId,
            reason: "localStorage places empty",
            remoteCount: remotePlaces.length,
          });
        }

        const tripDates = resolveTripDates(detailData.events);
        tripDatesRef.current = tripDates;

        let remoteEvents = await fetchSupabaseItinerariesByTripId(
          tripId,
          tripDates,
        );
        const localEvents = detailData.events;

        if (remoteEvents.length === 0 && localEvents.length > 0) {
          remoteEvents = await migrateLocalItinerariesToSupabase(
            tripId,
            localEvents,
            tripDates,
            remotePlaces,
          );
        }

        let remoteExpenses = await fetchSupabaseExpensesByTripId(tripId);
        const localExpenses = detailData.expenses;

        if (remoteExpenses.length === 0 && localExpenses.length > 0) {
          remoteExpenses = await migrateLocalExpensesToSupabase(
            tripId,
            localExpenses,
            remoteEvents,
          );
        }

        let remoteChecklists = await fetchSupabaseChecklistsByTripId(tripId);
        const localChecklists = detailData.checklist;

        if (remoteChecklists.length === 0 && localChecklists.length > 0) {
          remoteChecklists = await migrateLocalChecklistsToSupabase(
            tripId,
            localChecklists,
          );
        }

        let remoteMemos = await fetchSupabaseMemosByTripId(tripId);
        const localMemos = detailData.notes;

        if (remoteMemos.length === 0 && localMemos.length > 0) {
          remoteMemos = await migrateLocalMemosToSupabase(tripId, localMemos);
        }

        if (!cancelled) {
          setDetailStorageMode("supabase");
          setData({
            ...detailData,
            places: remotePlaces,
            events: remoteEvents,
            expenses: remoteExpenses,
            checklist: remoteChecklists,
            notes: remoteMemos,
          });
          setHydrated(true);
        }
      } catch (error) {
        logContextError("[TripFlow Detail] load error", error);
        const msg =
          error instanceof Error ? error.message : "Supabase 상세 데이터 로드 실패";
        if (!cancelled) {
          fallbackToLocal(msg);
          setHydrated(true);
        }
      }
    }

    setHydrated(false);
    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [
    tripId,
    authLoading,
    authMode,
    user,
    fallbackToLocal,
    resolveTripDates,
  ]);

  useEffect(() => {
    if (!hydrated) return;

    if (detailStorageMode === "local") {
      saveTripDetailData(tripId, data);
      return;
    }

    saveTripDetailDataPreservingRemoteFields(tripId, data, {
      places: true,
      events: true,
      expenses: true,
      checklist: true,
      notes: true,
    });
  }, [tripId, data, hydrated, detailStorageMode]);

  const updateData = useCallback(
    (updater: (prev: TripDetailData) => TripDetailData) => {
      setData((prev) => {
        const next = updater(prev);

        if (
          prev.places !== next.places ||
          prev.events !== next.events ||
          prev.expenses !== next.expenses ||
          prev.checklist !== next.checklist ||
          prev.notes !== next.notes
        ) {
          void syncDetailToSupabase(prev, next);
        }

        return next;
      });
    },
    [syncDetailToSupabase],
  );

  const getPlace = useCallback(
    (placeId: string) => getPlaceById(data.places, placeId),
    [data.places],
  );

  const value = useMemo(
    () => ({
      tripId,
      data,
      hydrated,
      updateData,
      getPlaceById: getPlace,
    }),
    [tripId, data, hydrated, updateData, getPlace],
  );

  return (
    <TripDetailContext.Provider value={value}>
      {children}
    </TripDetailContext.Provider>
  );
}

export function useTripDetail() {
  const ctx = useContext(TripDetailContext);
  if (!ctx) {
    throw new Error("useTripDetail must be used within TripDetailProvider");
  }
  return ctx;
}

/** Place upsert 후 갱신된 places 배열과 place 반환 */
export function upsertPlaceInData(
  data: TripDetailData,
  name: string,
  mapsLink?: string,
): { data: TripDetailData; place: Place } {
  const result = upsertPlace(data.places, name, mapsLink);
  return {
    data: { ...data, places: result.places },
    place: result.place,
  };
}
