import {
  buildItineraryPayloadMap,
  itineraryPayloadsEqual,
  itineraryRowToEvent,
} from "@/lib/itinerary-map";
import { prepareItinerariesForSupabaseMigration } from "@/lib/itinerary-migration";
import { getSupabaseClient, logSupabaseQueryResult } from "@/lib/supabase";
import type { Event } from "@/types/event";
import type { Place } from "@/types/place";
import type {
  SupabaseItineraryInsert,
  SupabaseItineraryRow,
  SupabaseItineraryUpdate,
} from "@/types/supabase-itinerary";

function itineraryInsertToUpdate(
  row: SupabaseItineraryInsert,
): SupabaseItineraryUpdate {
  return {
    place_id: row.place_id,
    day_number: row.day_number,
    start_time: row.start_time,
    end_time: row.end_time,
    title: row.title,
    memo: row.memo,
    sort_order: row.sort_order,
    updated_at: new Date().toISOString(),
  };
}

function toValidPlaceIds(places: Place[]): Set<string> {
  return new Set(places.map((place) => place.id));
}

/** trip_id 기준 일정 목록 조회 */
export async function fetchSupabaseItinerariesByTripId(
  tripId: string,
  tripDates: string[],
): Promise<Event[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client
    .from("itineraries")
    .select("*")
    .eq("trip_id", tripId)
    .order("day_number", { ascending: true })
    .order("sort_order", { ascending: true });

  logSupabaseQueryResult("itineraries.select", { tripId, tripDates, data }, error);
  if (error) throw error;

  return (data as SupabaseItineraryRow[]).map((row) =>
    itineraryRowToEvent(row, tripDates),
  );
}

/** 일정 생성 */
export async function insertSupabaseItinerary(
  row: SupabaseItineraryInsert,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const logInsertResult = (
    label: string,
    payload: SupabaseItineraryInsert,
    data: unknown,
    error: { message?: string; code?: string; details?: string; hint?: string } | null,
    status?: number,
  ) => {
    console.log(`[Supabase Query] ${label}`, {
      trip_id: payload.trip_id,
      id: payload.id,
      start_time: payload.start_time,
      title: payload.title,
      success: !error,
      error: error
        ? {
            message: error.message ?? null,
            code: error.code ?? null,
            details: error.details ?? null,
            hint: error.hint ?? null,
          }
        : null,
      status: status ?? null,
      returnedIds: Array.isArray(data)
        ? data.map((row) => (row as { id?: string }).id)
        : null,
    });
    logSupabaseQueryResult(label, { row: payload, data }, error);
  };

  const isStartTimeNotNullViolation = (
    error: { message?: string; code?: string } | null,
  ): boolean => {
    if (!error) return false;
    if (error.code === "23502") return true;
    const message = error.message ?? "";
    return /start_time/i.test(message) && /null/i.test(message);
  };

  let { data, error, status } = await client
    .from("itineraries")
    .insert(row)
    .select();

  logInsertResult("itineraries.insert", row, data, error, status);

  // start_time NOT NULL 인 구 DB 호환: null → '' 로 1회 재시도
  if (row.start_time === null && isStartTimeNotNullViolation(error)) {
    const fallbackRow: SupabaseItineraryInsert = {
      ...row,
      start_time: "",
    };
    console.warn(
      "[Supabase Query] itineraries.insert.retry_empty_start_time",
      {
        id: row.id,
        trip_id: row.trip_id,
        reason: "start_time NOT NULL constraint (23502)",
      },
    );

    ({ data, error, status } = await client
      .from("itineraries")
      .insert(fallbackRow)
      .select());

    logInsertResult(
      "itineraries.insert.retry",
      fallbackRow,
      data,
      error,
      status,
    );
  }

  if (error) throw error;

  // insert 직후 동일 trip 에서 row 존재 여부 확인
  const { data: verifyRows, error: verifyError, status: verifyStatus } =
    await client
      .from("itineraries")
      .select("id, trip_id, start_time, title")
      .eq("trip_id", row.trip_id)
      .eq("id", row.id);

  console.log("[Supabase Query] itineraries.insert.verify_select", {
    trip_id: row.trip_id,
    id: row.id,
    found: Array.isArray(verifyRows) && verifyRows.length > 0,
    rows: verifyRows,
    success: !verifyError,
    error: verifyError
      ? {
          message: verifyError.message ?? null,
          code: verifyError.code ?? null,
        }
      : null,
    status: verifyStatus ?? null,
  });
}

/** 일정 수정 */
export async function updateSupabaseItinerary(
  id: string,
  row: SupabaseItineraryInsert,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");
  const updateRow = itineraryInsertToUpdate(row);

  let { error, status } = await client
    .from("itineraries")
    .update(updateRow)
    .eq("id", id);

  logSupabaseQueryResult(
    "itineraries.update",
    { itineraryId: id, row: updateRow, status },
    error,
  );

  if (
    error &&
    updateRow.start_time === null &&
    (error.code === "23502" ||
      (/start_time/i.test(error.message ?? "") &&
        /null/i.test(error.message ?? "")))
  ) {
    const fallbackUpdate = { ...updateRow, start_time: "" };
    console.warn(
      "[Supabase Query] itineraries.update.retry_empty_start_time",
      { id, reason: "start_time NOT NULL constraint (23502)" },
    );
    ({ error, status } = await client
      .from("itineraries")
      .update(fallbackUpdate)
      .eq("id", id));
    logSupabaseQueryResult(
      "itineraries.update.retry",
      { itineraryId: id, row: fallbackUpdate, status },
      error,
    );
  }

  if (error) throw error;
}

/** 일정 삭제 */
export async function deleteSupabaseItinerary(
  itineraryId: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client
    .from("itineraries")
    .delete()
    .eq("id", itineraryId);

  logSupabaseQueryResult("itineraries.delete", { itineraryId }, error);
  if (error) throw error;
}

/** itineraries 배열 diff 동기화 */
export async function syncSupabaseItinerariesDiff(
  tripId: string,
  tripDates: string[],
  prevEvents: Event[],
  nextEvents: Event[],
  places: Place[],
): Promise<void> {
  const validPlaceIds = toValidPlaceIds(places);
  const prevMap = buildItineraryPayloadMap(
    prevEvents,
    tripId,
    tripDates,
    validPlaceIds,
  );
  const nextMap = buildItineraryPayloadMap(
    nextEvents,
    tripId,
    tripDates,
    validPlaceIds,
  );

  const deletes = [...prevMap.keys()].filter((id) => !nextMap.has(id));
  const inserts = [...nextMap.keys()].filter((id) => !prevMap.has(id));
  const updates = [...nextMap.keys()].filter((id) => {
    if (!prevMap.has(id)) return false;
    return !itineraryPayloadsEqual(prevMap.get(id)!, nextMap.get(id)!);
  });

  console.log("[Supabase Query] itineraries.diff", {
    tripId,
    tripDates,
    deletes,
    inserts,
    updates,
  });

  await Promise.all(deletes.map((id) => deleteSupabaseItinerary(id)));

  await Promise.all(inserts.map((id) => insertSupabaseItinerary(nextMap.get(id)!)));

  await Promise.all(
    updates.map((id) => updateSupabaseItinerary(id, nextMap.get(id)!)),
  );
}

/**
 * LocalStorage → Supabase 일괄 이전
 * legacy event id 를 uuid 로 변환한다.
 */
export async function migrateLocalItinerariesToSupabase(
  tripId: string,
  localEvents: Event[],
  tripDates: string[],
  places: Place[],
): Promise<Event[]> {
  if (localEvents.length === 0) return [];

  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const migratedEvents = prepareItinerariesForSupabaseMigration(localEvents);
  const validPlaceIds = toValidPlaceIds(places);
  const rows = [...buildItineraryPayloadMap(
    migratedEvents,
    tripId,
    tripDates,
    validPlaceIds,
  ).values()];

  let { data, error } = await client.from("itineraries").insert(rows).select();

  if (
    error &&
    (error.code === "23502" ||
      (/start_time/i.test(error.message ?? "") &&
        /null/i.test(error.message ?? ""))) &&
    rows.some((row) => row.start_time === null)
  ) {
    const fallbackRows = rows.map((row) =>
      row.start_time === null ? { ...row, start_time: "" } : row,
    );
    console.warn(
      "[Supabase Query] itineraries.migrate.retry_empty_start_time",
      { tripId, count: fallbackRows.length },
    );
    ({ data, error } = await client
      .from("itineraries")
      .insert(fallbackRows)
      .select());
  }

  logSupabaseQueryResult("itineraries.migrate", { tripId, tripDates, rows, data }, error);
  if (error) throw error;

  return migratedEvents;
}
