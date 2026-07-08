"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createTrip, normalizeTrip, updateTrip as applyTripUpdate } from "@/lib/trip-utils";
import { deleteTripDetailData } from "@/lib/trip-detail-storage";
import { deleteMyMapsLink } from "@/lib/trip-maps";
import type { CreateTripInput, Trip } from "@/types/trip";

const STORAGE_KEY = "tripflow-trips";

/** 더 이상 사용하지 않는 샘플 여행 ID */
const SAMPLE_TRIP_IDS = new Set([
  "trip-fukuoka",
  "trip-tokyo",
  "trip-osaka",
]);

interface TripContextValue {
  trips: Trip[];
  addTrip: (input: CreateTripInput) => Trip;
  updateTrip: (id: string, input: CreateTripInput) => void;
  deleteTrip: (id: string) => void;
  getTripById: (id: string) => Trip | undefined;
}

const TripContext = createContext<TripContextValue | null>(null);

function loadTrips(): Trip[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Trip[];
      if (Array.isArray(parsed)) {
        return parsed
          .filter((trip) => !SAMPLE_TRIP_IDS.has(trip.id))
          .map((trip) => normalizeTrip(trip));
      }
    }
  } catch {
    // 저장 데이터가 깨진 경우 빈 목록
  }
  return [];
}

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTrips(loadTrips());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  }, [trips, hydrated]);

  const addTrip = useCallback((input: CreateTripInput) => {
    const newTrip = createTrip(input);
    setTrips((prev) => [newTrip, ...prev]);
    return newTrip;
  }, []);

  const updateTrip = useCallback((id: string, input: CreateTripInput) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === id ? applyTripUpdate(trip, input) : trip,
      ),
    );
  }, []);

  const deleteTrip = useCallback((id: string) => {
    setTrips((prev) => prev.filter((trip) => trip.id !== id));
    deleteTripDetailData(id);
    deleteMyMapsLink(id);
  }, []);

  const getTripById = useCallback(
    (id: string) => trips.find((t) => t.id === id),
    [trips],
  );

  const value = useMemo(
    () => ({
      trips,
      addTrip,
      updateTrip,
      deleteTrip,
      getTripById,
    }),
    [trips, addTrip, updateTrip, deleteTrip, getTripById],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrips() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrips must be used within TripProvider");
  return ctx;
}
