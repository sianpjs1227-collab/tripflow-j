import { preparePlacesForSupabaseMigration } from "@/lib/place-migration";
import {
  inferPlaceSource,
  normalizePlaceCategory,
} from "@/lib/place-utils";
import { isPlaceVisited } from "@/lib/place-visit";
import { getSupabaseClient } from "@/lib/supabase";
import type { Place } from "@/types/place";
import type {
  SupabasePlaceInsert,
  SupabasePlaceRow,
  SupabasePlaceUpdate,
} from "@/types/supabase-place";

function placeToSupabaseInsert(
  place: Place,
  tripId: string,
): SupabasePlaceInsert {
  const visited = isPlaceVisited(place);

  return {
    id: place.id,
    trip_id: tripId,
    name: place.name,
    address: place.address ?? null,
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
    category: place.category,
    memo: place.memo ?? null,
    visited,
    visited_at:
      visited && place.visit?.visitedAt ? place.visit.visitedAt : null,
  };
}

function placeToSupabaseUpdate(place: Place): SupabasePlaceUpdate {
  const visited = isPlaceVisited(place);

  return {
    name: place.name,
    address: place.address ?? null,
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
    category: place.category,
    memo: place.memo ?? null,
    visited,
    visited_at:
      visited && place.visit?.visitedAt ? place.visit.visitedAt : null,
    updated_at: new Date().toISOString(),
  };
}

function supabaseFieldsEqual(a: Place, b: Place): boolean {
  const visitedA = isPlaceVisited(a);
  const visitedB = isPlaceVisited(b);

  return (
    a.name === b.name &&
    (a.address ?? null) === (b.address ?? null) &&
    (a.latitude ?? null) === (b.latitude ?? null) &&
    (a.longitude ?? null) === (b.longitude ?? null) &&
    a.category === b.category &&
    (a.memo ?? null) === (b.memo ?? null) &&
    visitedA === visitedB &&
    (a.visit?.visitedAt ?? null) === (b.visit?.visitedAt ?? null)
  );
}

/** Supabase 행 → 앱 Place */
export function supabaseRowToPlace(row: SupabasePlaceRow): Place {
  const place: Place = {
    id: row.id,
    name: row.name,
    category: normalizePlaceCategory(row.category),
    address: row.address ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    memo: row.memo ?? undefined,
    source: undefined,
  };

  if (row.visited && row.visited_at) {
    place.visit = {
      status: "visited",
      visitedAt: row.visited_at,
    };
  }

  place.source = inferPlaceSource(place);

  return place;
}

/** trip_id 기준 장소 목록 조회 */
export async function fetchSupabasePlacesByTripId(
  tripId: string,
): Promise<Place[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client
    .from("places")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data as SupabasePlaceRow[]).map(supabaseRowToPlace);
}

/** 장소 생성 */
export async function insertSupabasePlace(
  tripId: string,
  place: Place,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client
    .from("places")
    .insert(placeToSupabaseInsert(place, tripId));

  if (error) throw error;
}

/** 장소 수정 */
export async function updateSupabasePlace(place: Place): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client
    .from("places")
    .update(placeToSupabaseUpdate(place))
    .eq("id", place.id);

  if (error) throw error;
}

/** 장소 삭제 */
export async function deleteSupabasePlace(placeId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client.from("places").delete().eq("id", placeId);

  if (error) throw error;
}

/** places 배열 diff 동기화 */
export async function syncSupabasePlacesDiff(
  tripId: string,
  prevPlaces: Place[],
  nextPlaces: Place[],
): Promise<void> {
  const prevMap = new Map(prevPlaces.map((place) => [place.id, place]));
  const nextMap = new Map(nextPlaces.map((place) => [place.id, place]));

  const deletes = [...prevMap.keys()].filter((id) => !nextMap.has(id));
  const inserts = [...nextMap.keys()].filter((id) => !prevMap.has(id));
  const updates = [...nextMap.keys()].filter((id) => {
    if (!prevMap.has(id)) return false;
    return !supabaseFieldsEqual(prevMap.get(id)!, nextMap.get(id)!);
  });

  await Promise.all(deletes.map((id) => deleteSupabasePlace(id)));

  await Promise.all(
    inserts.map((id) => insertSupabasePlace(tripId, nextMap.get(id)!)),
  );

  await Promise.all(updates.map((id) => updateSupabasePlace(nextMap.get(id)!)));
}

/**
 * LocalStorage → Supabase 일괄 이전
 * legacy place id 를 uuid 로 변환한다.
 */
export async function migrateLocalPlacesToSupabase(
  tripId: string,
  localPlaces: Place[],
): Promise<{ places: Place[]; idMap: Record<string, string> }> {
  if (localPlaces.length === 0) return { places: [], idMap: {} };

  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { places, idMap } = preparePlacesForSupabaseMigration(localPlaces);
  const rows = places.map((place) => placeToSupabaseInsert(place, tripId));

  const { error } = await client.from("places").insert(rows);

  if (error) throw error;

  return { places, idMap };
}
