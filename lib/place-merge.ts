import type { Place } from "@/types/place";
import { isPendingPlaceDeletion } from "@/lib/place-pending-deletes";

/**
 * remote + local-only(미동기화) 장소 merge.
 * - 동일 id: remote 우선 (서버 변경 반영)
 * - local에만 있는 id: 유지 (KML import pending 등)
 * - remote에만 있어도 로컬에서 삭제 대기 중(tombstone)이면 제외
 */
export function mergeRemoteAndLocalPlaces(
  remotePlaces: Place[],
  localPlaces: Place[],
): Place[] {
  const byId = new Map<string, Place>();

  for (const place of remotePlaces) {
    if (isPendingPlaceDeletion(place.id)) {
      console.log("[places.merge] skip remote (pending delete)", {
        id: place.id,
        name: place.name,
      });
      continue;
    }
    byId.set(place.id, place);
  }

  for (const place of localPlaces) {
    if (isPendingPlaceDeletion(place.id)) {
      continue;
    }
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
  return localPlaces.filter(
    (place) => !remoteIds.has(place.id) && !isPendingPlaceDeletion(place.id),
  );
}
