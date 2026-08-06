import { preparePlacesForSupabaseMigration } from "@/lib/place-migration";
import { isPendingPlaceDeletion } from "@/lib/place-pending-deletes";
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
import { purgePlacesFromTripDetail } from "@/lib/trip-detail-storage";
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
    is_hidden: place.hidden === true,
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
    is_hidden: place.hidden === true,
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
    (a.visit?.visitedAt ?? null) === (b.visit?.visitedAt ?? null) &&
    (a.hidden === true) === (b.hidden === true)
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

  if (row.is_hidden) {
    place.hidden = true;
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

  const places = (data as SupabasePlaceRow[]).map(supabaseRowToPlace);
  console.log(`[fetch] remotePlaces=${places.length}`, { tripId });
  console.log("[placeCount.pipeline][fetch]", {
    tripId,
    "3_remote": places.length,
  });
  return places;
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

/** 장소 삭제 — affected rows 검증 (RLS로 0행이면 성공처럼 보이던 문제 방지) */
export async function deleteSupabasePlace(
  placeId: string,
): Promise<{ affectedRows: number; alreadyAbsent: boolean; data: unknown }> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const payload = { placeId };

  // delete 전 존재 여부 확인 — 0행이 "없음" vs "RLS 거부" 구분
  const { data: existing, error: existingError } = await client
    .from("places")
    .select("id, name, trip_id")
    .eq("id", placeId)
    .maybeSingle();

  console.log("[Supabase Query] places.delete.precheck", {
    payload,
    existing,
    existingError: existingError
      ? {
          message: existingError.message,
          code: existingError.code,
          details: existingError.details,
        }
      : null,
  });

  if (existingError) throw existingError;

  if (!existing) {
    console.log("[Supabase Query] places.delete.result", {
      payload,
      error: null,
      affectedRows: 0,
      alreadyAbsent: true,
      note: "row not visible/absent — treat delete as done",
    });
    return { affectedRows: 0, alreadyAbsent: true, data: null };
  }

  const { data, error, count } = await client
    .from("places")
    .delete({ count: "exact" })
    .eq("id", placeId)
    .select("id");

  const affectedRows =
    typeof count === "number"
      ? count
      : Array.isArray(data)
        ? data.length
        : 0;

  console.log("[Supabase Query] places.delete.result", {
    payload,
    error: error
      ? {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        }
      : null,
    affectedRows,
    alreadyAbsent: false,
    returnedIds: Array.isArray(data)
      ? data.map((row: { id?: string }) => row.id)
      : data,
    precheckName: existing.name,
  });

  logSupabaseQueryResult(
    "places.delete",
    { placeId, affectedRows, data, precheck: existing },
    error,
  );

  if (error) throw error;

  if (affectedRows === 0) {
    console.error(
      "[Supabase Query Error] places.delete\n" +
        `message: row existed but delete matched 0 rows (likely RLS)\n` +
        `code: DELETE_ZERO_ROWS\n` +
        `details: placeId=${placeId} name=${existing.name}`,
    );
    throw new Error(
      `places.delete affected 0 rows for id=${placeId} (RLS blocked?)`,
    );
  }

  return { affectedRows, alreadyAbsent: false, data };
}

/** places 배열 diff 동기화 */
export async function syncSupabasePlacesDiff(
  tripId: string,
  prevPlaces: Place[],
  nextPlaces: Place[],
): Promise<void> {
  console.log("[sync] start", {
    tripId,
    prevPlaces: prevPlaces.length,
    nextPlaces: nextPlaces.length,
  });

  const prevMap = new Map(prevPlaces.map((place) => [place.id, place]));
  const nextMap = new Map(nextPlaces.map((place) => [place.id, place]));

  const deletes = [...prevMap.keys()].filter((id) => !nextMap.has(id));
  // tombstone 이 남은 삭제분은 절대 insert 하지 않음 (merge_pending 복원 방지)
  const inserts = [...nextMap.keys()].filter(
    (id) => !prevMap.has(id) && !isPendingPlaceDeletion(id),
  );
  const updates = [...nextMap.keys()].filter((id) => {
    if (!prevMap.has(id)) return false;
    if (isPendingPlaceDeletion(id)) return false;
    return !supabaseFieldsEqual(prevMap.get(id)!, nextMap.get(id)!);
  });

  const skippedInserts = [...nextMap.keys()].filter(
    (id) => !prevMap.has(id) && isPendingPlaceDeletion(id),
  );
  if (skippedInserts.length > 0) {
    console.warn("[places.delete.persist][sync.skipInsertPendingDeletes]", {
      tripId,
      skippedInserts,
      note: "blocked re-insert of tombstoned (deleted) place ids",
    });
  }

  console.log(
    `[sync] insert=${inserts.length} update=${updates.length} delete=${deletes.length}`,
    { tripId, deletes, inserts, updates },
  );
  console.log("[Supabase Query] places.diff", {
    tripId,
    deletes,
    inserts,
    updates,
    deletesHaveIds: deletes.length > 0,
    deleteNames: deletes.map((id) => prevMap.get(id)?.name ?? id),
  });
  console.log("[places.delete.persist][2_syncDiff.deletes]", {
    tripId,
    deletes,
    deleteNames: deletes.map((id) => prevMap.get(id)?.name ?? id),
  });

  const successfullyDeleted: string[] = [];
  for (const id of deletes) {
    const result = await deleteSupabasePlace(id);
    successfullyDeleted.push(id);
    console.log("[places.delete.persist][3_supabaseDelete]", {
      tripId,
      placeId: id,
      name: prevMap.get(id)?.name ?? null,
      affectedRows: result.affectedRows,
      alreadyAbsent: result.alreadyAbsent,
      ok: result.affectedRows > 0 || result.alreadyAbsent,
    });
  }

  // Supabase 삭제 성공 후에도 tombstone 은 유지한다.
  // (너무 일찍 clear 하면 LS 에 남은 삭제분이 merge_pending → insert 로 복원됨)
  // LS 에서만 강제 purge — clear 는 loadDetail merge 확정 후 수행
  if (successfullyDeleted.length > 0) {
    purgePlacesFromTripDetail(tripId, successfullyDeleted);
    console.log("[places.delete.persist][tombstone.keepAfterDelete]", {
      tripId,
      deletedIds: successfullyDeleted,
      note: "tombstones kept until loadDetail merge confirms no resurrection",
    });
  }

  await Promise.all(
    inserts.map((id) => insertSupabasePlace(tripId, nextMap.get(id)!)),
  );

  await Promise.all(updates.map((id) => updateSupabasePlace(nextMap.get(id)!)));

  console.log("[sync] done", {
    tripId,
    insert: inserts.length,
    update: updates.length,
    delete: successfullyDeleted.length,
    deletedIds: successfullyDeleted,
  });
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
