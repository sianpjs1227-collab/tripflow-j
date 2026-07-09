import { loadFavoritePlaceIds, saveFavoritePlaceIds } from "@/lib/place-favorites";
import type { Place } from "@/types/place";
import type { TripDetailData } from "@/types/trip-detail";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPlaceUuid(id: string): boolean {
  return UUID_RE.test(id);
}

export interface PlaceMigrationResult {
  places: Place[];
  idMap: Record<string, string>;
}

/** legacy place id → uuid 변환 (Supabase 마이그레이션용) */
export function preparePlacesForSupabaseMigration(
  localPlaces: Place[],
): PlaceMigrationResult {
  const idMap: Record<string, string> = {};

  const places = localPlaces.map((place) => {
    if (isPlaceUuid(place.id)) return place;

    const newId = crypto.randomUUID();
    idMap[place.id] = newId;
    return { ...place, id: newId };
  });

  return { places, idMap };
}

/** place id 변경 시 일정·즐겨찾기 참조 갱신 */
export function applyPlaceIdRemapping(
  tripId: string,
  data: TripDetailData,
  idMap: Record<string, string>,
): TripDetailData {
  if (Object.keys(idMap).length === 0) return data;

  const remapId = (id: string) => idMap[id] ?? id;

  const favoriteIds = loadFavoritePlaceIds(tripId);
  if (favoriteIds.length > 0) {
    saveFavoritePlaceIds(tripId, favoriteIds.map(remapId));
  }

  return {
    ...data,
    events: data.events.map((event) => ({
      ...event,
      placeId: remapId(event.placeId),
    })),
  };
}
