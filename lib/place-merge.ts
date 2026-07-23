import type { Place } from "@/types/place";

/**
 * remote + local-only(미동기화) 장소 merge.
 * - 동일 id: remote 우선 (서버 변경 반영)
 * - local에만 있는 id: 유지 (KML import pending 등)
 */
export function mergeRemoteAndLocalPlaces(
  remotePlaces: Place[],
  localPlaces: Place[],
): Place[] {
  const byId = new Map<string, Place>();

  for (const place of remotePlaces) {
    byId.set(place.id, place);
  }

  for (const place of localPlaces) {
    if (!byId.has(place.id)) {
      byId.set(place.id, place);
    }
  }

  return [...byId.values()];
}

/** local에만 있고 remote에 없는 장소 (미동기화 pending) */
export function getLocalOnlyPlaces(
  remotePlaces: Place[],
  localPlaces: Place[],
): Place[] {
  const remoteIds = new Set(remotePlaces.map((place) => place.id));
  return localPlaces.filter((place) => !remoteIds.has(place.id));
}
