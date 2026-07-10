import type { TripDetailData } from "@/types/trip-detail";
import { createEmptyTripDetailData } from "@/types/trip-detail";
import type { Expense } from "@/types/expense";
import type { Place, PlaceSource } from "@/types/place";
import {
  inferPlaceSource,
  normalizePlaceCategory,
} from "@/lib/place-utils";
import { normalizePlaceVisit } from "@/lib/place-visit";
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

  const place: Place = {
    ...raw,
    category: normalizePlaceCategory(raw.category as string),
    latitude,
    longitude,
    address: raw.address?.trim() || undefined,
  };

  const source: PlaceSource = raw.source ?? inferPlaceSource(place);
  const visit = normalizePlaceVisit(raw.visit);

  return {
    ...place,
    source,
    visit,
  };
}

function normalizeExpense(raw: Expense): Expense {
  const amount =
    raw.amount != null && !Number.isNaN(raw.amount) ? raw.amount : 0;
  const krwAmount =
    raw.krwAmount != null && !Number.isNaN(raw.krwAmount)
      ? raw.krwAmount
      : undefined;

  return {
    ...raw,
    amount,
    krwAmount,
    title: raw.title?.trim() || undefined,
    currency: raw.currency?.trim() || undefined,
    paidBy: raw.paidBy?.trim() || undefined,
    memo: raw.memo?.trim() || undefined,
    spentAt: raw.spentAt?.trim() || undefined,
  };
}

function normalizeTripDetailData(data: TripDetailData): TripDetailData {
  return {
    ...data,
    places: (data.places ?? []).map(normalizePlace),
    events: data.events ?? [],
    expenses: (data.expenses ?? []).map(normalizeExpense),
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

/** places·events 를 제외한 나머지 상세 데이터만 저장 (Supabase 모드용) */
export function saveTripDetailDataPreservingRemoteFields(
  tripId: string,
  data: TripDetailData,
  preserve: {
    places?: boolean;
    events?: boolean;
    expenses?: boolean;
    checklist?: boolean;
    notes?: boolean;
  },
): void {
  const existing = loadTripDetailData(tripId);
  saveTripDetailData(tripId, {
    ...data,
    places: preserve.places ? existing.places : data.places,
    events: preserve.events ? existing.events : data.events,
    expenses: preserve.expenses ? existing.expenses : data.expenses,
    checklist: preserve.checklist ? existing.checklist : data.checklist,
    notes: preserve.notes ? existing.notes : data.notes,
  });
}

/** @deprecated saveTripDetailDataPreservingRemoteFields 사용 */
export function saveTripDetailDataPreservingPlaces(
  tripId: string,
  data: TripDetailData,
): void {
  saveTripDetailDataPreservingRemoteFields(tripId, data, { places: true });
}

/** 여행 상세 데이터 삭제 */
export function deleteTripDetailData(tripId: string): void {
  const store = readStore();
  delete store[tripId];
  writeStore(store);
}
