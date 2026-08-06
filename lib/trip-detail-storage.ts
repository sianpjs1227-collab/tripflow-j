import type { TripDetailData } from "@/types/trip-detail";
import { createEmptyTripDetailData } from "@/types/trip-detail";
import type { Expense } from "@/types/expense";
import type { Place, PlaceSource } from "@/types/place";
import { isPendingPlaceDeletion } from "@/lib/place-pending-deletes";
import {
  inferPlaceSource,
  normalizePlaceCategory,
} from "@/lib/place-utils";
import { normalizePlaceVisit } from "@/lib/place-visit";
import { normalizeNote } from "@/lib/note-utils";
import type { Note } from "@/types/note";
import { notifyTripDetailUpdated } from "@/lib/trip-detail-events";

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
  const hidden = raw.hidden === true ? true : undefined;

  return {
    ...place,
    source,
    visit,
    hidden,
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

/**
 * localStorage places 에서 삭제된 id 를 강제 제거.
 * stale useEffect 가 옛 places 를 다시 써도 merge_pending 이
 * 삭제분을 local-only insert 로 오인하지 않게 한다.
 */
export function purgePlacesFromTripDetail(
  tripId: string,
  placeIds: string[],
): void {
  if (placeIds.length === 0) return;
  const remove = new Set(placeIds);
  const existing = loadTripDetailData(tripId);
  const nextPlaces = existing.places.filter((place) => !remove.has(place.id));
  if (nextPlaces.length === existing.places.length) {
    console.log("[places.delete.persist][purgeLS] noop", {
      tripId,
      placeIds,
      placesLength: existing.places.length,
    });
    return;
  }
  console.log("[places.delete.persist][purgeLS]", {
    tripId,
    removedIds: placeIds,
    before: existing.places.length,
    after: nextPlaces.length,
  });
  // pending delete 필터를 우회하지 않도록 직접 write (아래 save 가 필터함)
  const store = readStore();
  store[tripId] = { ...existing, places: nextPlaces };
  writeStore(store);
  notifyTripDetailUpdated(tripId);
}

export function saveTripDetailData(tripId: string, data: TripDetailData): void {
  // stale Context effect 가 삭제된 place 를 다시 쓰지 못하도록 tombstone 필터
  const places = data.places.filter(
    (place) => !isPendingPlaceDeletion(place.id),
  );
  const stripped = data.places.length - places.length;
  if (stripped > 0) {
    console.log("[places.delete.persist][save.stripPendingDeletes]", {
      tripId,
      stripped,
      before: data.places.length,
      after: places.length,
    });
  }

  const toSave = stripped > 0 ? { ...data, places } : data;

  console.log(`[saveTripDetailData] places=${toSave.places.length}`, {
    tripId,
    stage: "before_write",
  });
  console.log("[places.delete.persist][4_saveTripDetailData]", {
    tripId,
    placesLength: toSave.places.length,
  });
  const store = readStore();
  store[tripId] = toSave;
  writeStore(store);
  notifyTripDetailUpdated(tripId);
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
