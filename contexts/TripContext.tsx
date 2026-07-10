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
import { createTrip, updateTrip as applyTripUpdate } from "@/lib/trip-utils";
import { computeAutoTripStatus } from "@/lib/trip-lifecycle";
import {
  loadTripsFromLocalStorage,
  saveTripsToLocalStorage,
} from "@/lib/trip-local-storage";
import {
  deleteSupabaseTrip,
  fetchSupabaseTrips,
  insertSupabaseTrip,
  migrateLocalTripsToSupabase,
  updateSupabaseTrip,
} from "@/lib/supabase-trips";
import { deleteTripDetailData } from "@/lib/trip-detail-storage";
import { deleteMyMapsLink, hydrateTripMyMapsFromLegacyStorage, syncMyMapsLegacyStorage, tripHasMyMaps } from "@/lib/trip-maps";
import type { CreateTripInput, Trip, TripStatus } from "@/types/trip";
import type { MyMapsConnection } from "@/types/mymaps";
import { tripHasExchangeRate } from "@/lib/currency-utils";

type TripStorageMode = "local" | "supabase";

function mergeTripExchangeFromLocal(remote: Trip, local?: Trip): Trip {
  if (!local || tripHasExchangeRate(remote)) return remote;
  if (!tripHasExchangeRate(local)) return remote;

  return {
    ...remote,
    currency: local.currency,
    exchangeRate: local.exchangeRate,
    exchangeRateMode: local.exchangeRateMode ?? remote.exchangeRateMode,
    exchangeRateDate: local.exchangeRateDate ?? remote.exchangeRateDate,
    exchangeRateUnit: local.exchangeRateUnit ?? remote.exchangeRateUnit,
    exchangeRateProvider:
      local.exchangeRateProvider ?? remote.exchangeRateProvider,
    exchangeRateUpdatedAt:
      local.exchangeRateUpdatedAt ?? remote.exchangeRateUpdatedAt,
  };
}

function mergeTripMyMapsFromLocal(remote: Trip, local?: Trip): Trip {
  if (tripHasMyMaps(remote)) return remote;

  const localTrip = local && tripHasMyMaps(local) ? local : null;
  const legacyTrip = hydrateTripMyMapsFromLegacyStorage(remote);
  const source = localTrip ?? (tripHasMyMaps(legacyTrip) ? legacyTrip : null);
  if (!source) return remote;

  return {
    ...remote,
    myMapsMapId: source.myMapsMapId ?? null,
    myMapsViewerUrl: source.myMapsViewerUrl ?? null,
  };
}

function mergeTripFromLocal(remote: Trip, local?: Trip): Trip {
  const withExchange = mergeTripExchangeFromLocal(remote, local);
  return mergeTripMyMapsFromLocal(withExchange, local);
}

interface TripContextValue {
  trips: Trip[];
  addTrip: (input: CreateTripInput) => Trip;
  updateTrip: (id: string, input: CreateTripInput) => void;
  patchTripExchangeRate: (
    id: string,
    patch: {
      exchangeRate: number | null;
      exchangeRateMode?: Trip["exchangeRateMode"];
      exchangeRateDate?: string | null;
      exchangeRateUnit?: number | null;
      exchangeRateProvider?: Trip["exchangeRateProvider"];
      exchangeRateUpdatedAt?: string | null;
    },
  ) => void;
  patchTripMyMaps: (id: string, connection: MyMapsConnection | null) => void;
  setTripStatus: (id: string, status: TripStatus) => void;
  resetTripStatusAuto: (id: string) => void;
  deleteTrip: (id: string) => void;
  getTripById: (id: string) => Trip | undefined;
}

const TripContext = createContext<TripContextValue | null>(null);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const { mode: authMode, user, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [storageMode, setStorageMode] = useState<TripStorageMode>("local");
  const [hydrated, setHydrated] = useState(false);
  const storageModeRef = useRef<TripStorageMode>("local");
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    storageModeRef.current = storageMode;
  }, [storageMode]);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

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

  const fallbackToLocal = useCallback((message: string) => {
    console.error("[TripFlow Trips]", message);
    setStorageMode("local");
    setTrips(loadTripsFromLocalStorage());
  }, []);

  const syncTripToSupabase = useCallback(
    async (trip: Trip, action: "insert" | "update") => {
      const userId = userIdRef.current;
      if (storageModeRef.current !== "supabase" || !userId) return;

      try {
        if (action === "insert") {
          await insertSupabaseTrip(userId, trip);
        } else {
          await updateSupabaseTrip(trip);
        }
      } catch (error) {
        logContextError("[TripFlow Trips] sync error", error);
        const msg =
          error instanceof Error ? error.message : "Supabase 동기화 실패";
        fallbackToLocal(msg);
      }
    },
    [fallbackToLocal, logContextError],
  );

  const deleteTripFromSupabase = useCallback(
    async (tripId: string) => {
      if (storageModeRef.current !== "supabase") return;

      try {
        await deleteSupabaseTrip(tripId);
      } catch (error) {
        logContextError("[TripFlow Trips] delete error", error);
        const msg =
          error instanceof Error ? error.message : "Supabase 삭제 실패";
        fallbackToLocal(msg);
      }
    },
    [fallbackToLocal, logContextError],
  );

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function loadTrips() {
      const useSupabase = authMode === "supabase" && user != null;

      if (!useSupabase) {
        if (!cancelled) {
          setStorageMode("local");
          setTrips(
            loadTripsFromLocalStorage().map((trip) =>
              hydrateTripMyMapsFromLegacyStorage(trip),
            ),
          );
          setHydrated(true);
        }
        return;
      }

      try {
        let remoteTrips = await fetchSupabaseTrips(user.id);
        const localTrips = loadTripsFromLocalStorage();
        const localById = new Map(localTrips.map((trip) => [trip.id, trip]));

        if (remoteTrips.length === 0 && localTrips.length > 0) {
          remoteTrips = await migrateLocalTripsToSupabase(
            user.id,
            localTrips.map((trip) => hydrateTripMyMapsFromLegacyStorage(trip)),
          );
        } else if (remoteTrips.length > 0) {
          remoteTrips = remoteTrips.map((remote) => {
            const merged = mergeTripFromLocal(remote, localById.get(remote.id));
            const remoteHadRate = tripHasExchangeRate(remote);
            const mergedHasRate = tripHasExchangeRate(merged);
            const remoteHadMyMaps = tripHasMyMaps(remote);
            const mergedHasMyMaps = tripHasMyMaps(merged);
            if (
              (!remoteHadRate && mergedHasRate) ||
              (!remoteHadMyMaps && mergedHasMyMaps)
            ) {
              void updateSupabaseTrip(merged);
            }
            return merged;
          });
        }

        if (!cancelled) {
          setStorageMode("supabase");
          setTrips(remoteTrips);
          setHydrated(true);
        }
      } catch (error) {
        logContextError("[TripFlow Trips] load error", error);
        const msg =
          error instanceof Error ? error.message : "Supabase 여행 로드 실패";
        if (!cancelled) {
          fallbackToLocal(msg);
          setHydrated(true);
        }
      }
    }

    setHydrated(false);
    void loadTrips();

    return () => {
      cancelled = true;
    };
  }, [authLoading, authMode, user, fallbackToLocal]);

  useEffect(() => {
    if (!hydrated) return;
    saveTripsToLocalStorage(trips);
  }, [trips, hydrated]);

  const addTrip = useCallback(
    (input: CreateTripInput) => {
      const newTrip = createTrip(input, {
        useUuid: storageModeRef.current === "supabase",
      });
      setTrips((prev) => [newTrip, ...prev]);
      void syncTripToSupabase(newTrip, "insert");
      return newTrip;
    },
    [syncTripToSupabase],
  );

  const updateTrip = useCallback(
    (id: string, input: CreateTripInput) => {
      setTrips((prev) => {
        const next = prev.map((trip) =>
          trip.id === id ? applyTripUpdate(trip, input) : trip,
        );
        const updated = next.find((trip) => trip.id === id);
        if (updated) void syncTripToSupabase(updated, "update");
        return next;
      });
    },
    [syncTripToSupabase],
  );

  const patchTripExchangeRate = useCallback(
    (
      id: string,
      patch: {
        exchangeRate: number | null;
        exchangeRateMode?: Trip["exchangeRateMode"];
        exchangeRateDate?: string | null;
        exchangeRateUnit?: number | null;
        exchangeRateProvider?: Trip["exchangeRateProvider"];
        exchangeRateUpdatedAt?: string | null;
      },
    ) => {
      setTrips((prev) => {
        const next = prev.map((trip) => {
          if (trip.id !== id) return trip;
          const exchangeRate = patch.exchangeRate;
          const exchangeRateDate =
            exchangeRate == null
              ? null
              : (patch.exchangeRateDate ?? trip.exchangeRateDate ?? null);
          return {
            ...trip,
            exchangeRate,
            exchangeRateMode:
              exchangeRate == null
                ? null
                : (patch.exchangeRateMode ?? trip.exchangeRateMode ?? null),
            exchangeRateDate,
            exchangeRateUnit:
              exchangeRate == null
                ? null
                : (patch.exchangeRateUnit ?? trip.exchangeRateUnit ?? null),
            exchangeRateProvider:
              exchangeRate == null
                ? null
                : (patch.exchangeRateProvider ??
                  trip.exchangeRateProvider ??
                  null),
            exchangeRateUpdatedAt:
              exchangeRate == null
                ? null
                : (patch.exchangeRateUpdatedAt ??
                  (exchangeRateDate
                    ? `${exchangeRateDate}T00:00:00.000Z`
                    : trip.exchangeRateUpdatedAt ?? null)),
          };
        });
        const updated = next.find((trip) => trip.id === id);
        if (updated) void syncTripToSupabase(updated, "update");
        return next;
      });
    },
    [syncTripToSupabase],
  );

  const patchTripMyMaps = useCallback(
    (id: string, connection: MyMapsConnection | null) => {
      setTrips((prev) => {
        const next = prev.map((trip) => {
          if (trip.id !== id) return trip;
          return {
            ...trip,
            myMapsMapId: connection?.mapId ?? null,
            myMapsViewerUrl: connection?.viewerUrl ?? null,
          };
        });
        const updated = next.find((trip) => trip.id === id);
        if (updated) {
          syncMyMapsLegacyStorage(id, connection);
          void syncTripToSupabase(updated, "update");
        }
        return next;
      });
    },
    [syncTripToSupabase],
  );

  const setTripStatus = useCallback(
    (id: string, status: TripStatus) => {
      setTrips((prev) => {
        const next = prev.map((trip) =>
          trip.id === id ? { ...trip, status, statusIsManual: true } : trip,
        );
        const updated = next.find((trip) => trip.id === id);
        if (updated) void syncTripToSupabase(updated, "update");
        return next;
      });
    },
    [syncTripToSupabase],
  );

  const resetTripStatusAuto = useCallback(
    (id: string) => {
      setTrips((prev) => {
        const next = prev.map((trip) => {
          if (trip.id !== id) return trip;
          const updated = {
            ...trip,
            statusIsManual: false,
            status: computeAutoTripStatus(trip.startDate, trip.endDate),
          };
          void syncTripToSupabase(updated, "update");
          return updated;
        });
        return next;
      });
    },
    [syncTripToSupabase],
  );

  const deleteTrip = useCallback(
    (id: string) => {
      setTrips((prev) => prev.filter((trip) => trip.id !== id));
      void deleteTripFromSupabase(id);
      deleteTripDetailData(id);
      deleteMyMapsLink(id);
    },
    [deleteTripFromSupabase],
  );

  const getTripById = useCallback(
    (id: string) => trips.find((t) => t.id === id),
    [trips],
  );

  const value = useMemo(
    () => ({
      trips,
      addTrip,
      updateTrip,
      patchTripExchangeRate,
      patchTripMyMaps,
      setTripStatus,
      resetTripStatusAuto,
      deleteTrip,
      getTripById,
    }),
    [
      trips,
      addTrip,
      updateTrip,
      patchTripExchangeRate,
      patchTripMyMaps,
      setTripStatus,
      resetTripStatusAuto,
      deleteTrip,
      getTripById,
    ],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrips() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrips must be used within TripProvider");
  return ctx;
}
