import type { Place } from "@/types/place";
import { getPendingPlaceDeletions } from "@/lib/place-pending-deletes";

/**
 * KML 삭제 직후 되살아남 / 최종 삭제 성공 추적.
 * watch id·이름에 대해 파이프라인 각 단계의 존재 여부를 로그한다.
 */

const watchedIds = new Set<string>();
const watchedNames = new Set<string>();

/** 기본 감시 이름 — 이번 이슈의 숙소 */
const DEFAULT_WATCH_NAMES = ["EN 호텔 하카타", "엔 호텔 하카타"];

for (const name of DEFAULT_WATCH_NAMES) {
  watchedNames.add(normalizeName(name));
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function watchDeletedPlaces(
  places: Array<{ id: string; name: string }>,
): void {
  for (const place of places) {
    watchedIds.add(place.id);
    watchedNames.add(normalizeName(place.name));
  }
  console.log("[places.delete.trace] watch", {
    ids: [...watchedIds],
    names: [...watchedNames],
  });
}

export function clearDeleteTraceWatch(): void {
  watchedIds.clear();
  watchedNames.clear();
  for (const name of DEFAULT_WATCH_NAMES) {
    watchedNames.add(normalizeName(name));
  }
}

function findWatched(places: Place[]): Place[] {
  return places.filter(
    (place) =>
      watchedIds.has(place.id) ||
      watchedNames.has(normalizeName(place.name)),
  );
}

export function logDeleteTrace(
  stage: string,
  tripId: string,
  places: Place[] | null | undefined,
  extra?: Record<string, unknown>,
): void {
  const list = places ?? [];
  const found = findWatched(list);
  const present = found.length > 0;

  console.log(`[places.delete.trace][${stage}]`, {
    tripId,
    t: new Date().toISOString(),
    placesLength: list.length,
    watchedPresent: present,
    watchedHits: found.map((place) => ({
      id: place.id,
      name: place.name,
      source: place.source ?? null,
      hidden: place.hidden === true,
    })),
    pendingDeletes: getPendingPlaceDeletions(),
    ...extra,
  });

  if (present) {
    console.warn(
      `[places.delete.trace][${stage}] ★ watched place STILL PRESENT`,
      found.map((place) => place.name),
    );
  } else if (watchedIds.size > 0 || watchedNames.size > 0) {
    console.log(
      `[places.delete.trace][${stage}] ✓ watched place ABSENT (delete reflected here)`,
    );
  }
}

export function logDeleteTraceFinalSuccess(
  tripId: string,
  source: string,
  places: Place[],
): void {
  if (watchedIds.size === 0) return;
  const found = findWatched(places);
  if (found.length > 0) return;

  console.log("[places.delete.trace][FINAL_DELETE_SUCCESS]", {
    tripId,
    t: new Date().toISOString(),
    source,
    placesLength: places.length,
    watchedIds: [...watchedIds],
    note: "watched place no longer present — deletion fully reflected at this stage",
  });
}
