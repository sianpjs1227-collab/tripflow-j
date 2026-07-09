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
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Supabase 상세 데이터 동기화 실패";
        fallbackToLocal(msg);
      }
    },
    [tripId, fallbackToLocal, resolveTripDates],
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

      try {
        let remotePlaces = await fetchSupabasePlacesByTripId(tripId);
        const localPlaces = localData.places;
        let detailData = localData;

        if (remotePlaces.length === 0 && localPlaces.length > 0) {
          const { places, idMap } = await migrateLocalPlacesToSupabase(
            tripId,
            localPlaces,
          );
          remotePlaces = places;
          detailData = applyPlaceIdRemapping(tripId, localData, idMap);
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

        if (!cancelled) {
          setDetailStorageMode("supabase");
          setData({
            ...detailData,
            places: remotePlaces,
            events: remoteEvents,
          });
          setHydrated(true);
        }
      } catch (error) {
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
    });
  }, [tripId, data, hydrated, detailStorageMode]);

  const updateData = useCallback(
    (updater: (prev: TripDetailData) => TripDetailData) => {
      setData((prev) => {
        const next = updater(prev);

        if (prev.places !== next.places || prev.events !== next.events) {
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
