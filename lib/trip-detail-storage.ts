import type { TripDetailData } from "@/types/trip-detail";
import { createEmptyTripDetailData } from "@/types/trip-detail";
import type { Place } from "@/types/place";
import { normalizePlaceCategory } from "@/lib/place-utils";
import { normalizeNote } from "@/lib/note-utils";
import type { Note } from "@/types/note";

const STORAGE_KEY = "tripflow-trip-details";

type TripDetailsStore = Record<string, TripDetailData>;

function normalizePlace(raw: Place): Place {
  const latitude =
    raw.latitude != null && !Number.isNaN(raw.latitude)
      ? raw.latitude
      : undefined;
  const longitude =
    raw.longitude != null && !Number.isNaN(raw.longitude)
      ? raw.longitude
      : undefined;

  return {
    ...raw,
    category: normalizePlaceCategory(raw.category as string),
    latitude,
    longitude,
  };
}

function normalizeTripDetailData(data: TripDetailData): TripDetailData {
  return {
    ...data,
    places: (data.places ?? []).map(normalizePlace),
    events: data.events ?? [],
    expenses: data.expenses ?? [],
    checklist: data.checklist ?? [],
    notes: (data.notes ?? []).map((note) =>
      normalizeNote(note as Note & { title?: string }),
    ),
  };
}

function readStore(): TripDetailsStore {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as TripDetailsStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: TripDetailsStore): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // 저장 실패 시 무시
  }
}

export function loadTripDetailData(tripId: string): TripDetailData {
  const store = readStore();
  const data = store[tripId] ?? createEmptyTripDetailData();
  return normalizeTripDetailData(data);
}

export function saveTripDetailData(tripId: string, data: TripDetailData): void {
  const store = readStore();
  store[tripId] = data;
  writeStore(store);
}

/** 여행 상세 데이터 삭제 */
export function deleteTripDetailData(tripId: string): void {
  const store = readStore();
  delete store[tripId];
  writeStore(store);
}
