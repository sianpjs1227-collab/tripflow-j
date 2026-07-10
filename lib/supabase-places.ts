import { preparePlacesForSupabaseMigration } from "@/lib/place-migration";
import {
  inferPlaceSource,
  normalizePlaceCategory,
} from "@/lib/place-utils";
import { isPlaceVisited } from "@/lib/place-visit";
import {
  getSupabaseClient,
  isUuid,
  logSupabaseQueryResult,
} from "@/lib/supabase";
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

function logUuidDiagnostics(
  tripId: string,
  rows: SupabasePlaceInsert[],
): void {
  const invalidPlaceIds = rows
    .filter((row) => !isUuid(row.id))
    .map((row) => row.id);
  const invalidTripIds = rows
    .filter((row) => !isUuid(row.trip_id))
    .map((row) => row.trip_id);

  console.log("[Supabase Query] places.migrate.uuid_check", {
    tripId,
    tripIdIsUuid: isUuid(tripId),
    rowCount: rows.length,
    invalidPlaceIds,
    invalidTripIds,
    note: "places table has no user_id column; membership is via trips/trip_members",
  });
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

  logSupabaseQueryResult("places.select", { tripId, data }, error);
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
  const row = placeToSupabaseInsert(place, tripId);

  const { data, error } = await client.from("places").insert(row).select();

  logSupabaseQueryResult("places.insert", { tripId, row, data }, error);
  if (error) throw error;
}

/** 장소 수정 */
export async function updateSupabasePlace(place: Place): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");
  const row = placeToSupabaseUpdate(place);

  const { error } = await client
    .from("places")
    .update(row)
    .eq("id", place.id);

  logSupabaseQueryResult("places.update", { placeId: place.id, row }, error);
  if (error) throw error;
}

/** 장소 삭제 */
export async function deleteSupabasePlace(placeId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client.from("places").delete().eq("id", placeId);

  logSupabaseQueryResult("places.delete", { placeId }, error);
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

  console.log("[Supabase Query] places.diff", {
    tripId,
    deletes,
    inserts,
    updates,
  });

  await Promise.all(deletes.map((id) => deleteSupabasePlace(id)));

  await Promise.all(
    inserts.map((id) => insertSupabasePlace(tripId, nextMap.get(id)!)),
  );

  await Promise.all(updates.map((id) => updateSupabasePlace(nextMap.get(id)!)));
}

/**
 * LocalStorage → Supabase 일괄 이전
 * - local 비어 있으면 skip
 * - 원격에 이미 places 있으면 skip
 * - 이미 존재하는 id 는 insert 에서 제외
 */
export async function migrateLocalPlacesToSupabase(
  tripId: string,
  localPlaces: Place[],
): Promise<{ places: Place[]; idMap: Record<string, string> }> {
  if (localPlaces.length === 0) {
    console.log("[Supabase Query] places.migrate.skip", {
      tripId,
      reason: "localStorage places empty",
    });
    return { places: [], idMap: {} };
  }

  if (!isUuid(tripId)) {
    console.error("[Supabase Query Error] places.migrate", {
      message: "trip_id is not a valid UUID",
      code: "INVALID_TRIP_ID",
      details: `trip_id=${tripId}`,
    });
    throw new Error(`places.migrate: invalid trip_id (not UUID): ${tripId}`);
  }

  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const existingRemote = await fetchSupabasePlacesByTripId(tripId);
  if (existingRemote.length > 0) {
    console.log("[Supabase Query] places.migrate.skip", {
      tripId,
      reason: "remote places already exist",
      remoteCount: existingRemote.length,
    });
    return { places: existingRemote, idMap: {} };
  }

  const { places, idMap } = preparePlacesForSupabaseMigration(localPlaces);
  const existingIds = new Set(existingRemote.map((place) => place.id));
  const rows = places
    .map((place) => placeToSupabaseInsert(place, tripId))
    .filter((row) => !existingIds.has(row.id));

  console.log("[Supabase Query] places.migrate.payload", {
    tripId,
    localCount: localPlaces.length,
    preparedCount: places.length,
    insertCount: rows.length,
    rows,
  });
  logUuidDiagnostics(tripId, rows);

  if (rows.length === 0) {
    console.log("[Supabase Query] places.migrate.skip", {
      tripId,
      reason: "no new place rows to insert",
    });
    return { places: existingRemote, idMap: {} };
  }

  const invalidIds = rows.filter((row) => !isUuid(row.id));
  if (invalidIds.length > 0) {
    console.error("[Supabase Query Error] places.migrate", {
      message: "place id is not a valid UUID",
      code: "INVALID_PLACE_ID",
      details: invalidIds.map((row) => row.id).join(", "),
    });
    throw new Error("places.migrate: one or more place ids are not UUID");
  }

  const { data, error } = await client.from("places").insert(rows).select();

  console.log("[Supabase Query] places.migrate", { tripId, rows, data });
  if (error) {
    console.error("[Supabase Query Error] places.migrate", {
      message: error.message ?? null,
      code: error.code ?? null,
      details: error.details ?? null,
      hint: error.hint ?? null,
    });
    throw error;
  }

  logSupabaseQueryResult("places.migrate", { tripId, rows, data }, error);

  return {
    places: (data as SupabasePlaceRow[] | null)?.map(supabaseRowToPlace) ?? places,
    idMap,
  };
}
