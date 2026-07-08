"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { TripDetailData } from "@/types/trip-detail";
import { createEmptyTripDetailData } from "@/types/trip-detail";
import type { Place } from "@/types/place";
import {
  loadTripDetailData,
  saveTripDetailData,
} from "@/lib/trip-detail-storage";
import { getPlaceById, upsertPlace } from "@/lib/place-utils";

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
  const [data, setData] = useState<TripDetailData>(createEmptyTripDetailData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadTripDetailData(tripId));
    setHydrated(true);
  }, [tripId]);

  useEffect(() => {
    if (!hydrated) return;
    saveTripDetailData(tripId, data);
  }, [tripId, data, hydrated]);

  const updateData = useCallback(
    (updater: (prev: TripDetailData) => TripDetailData) => {
      setData((prev) => updater(prev));
    },
    [],
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
