import {
  buildItineraryPayloadMap,
  itineraryPayloadsEqual,
  itineraryRowToEvent,
  toSupabaseStartTime,
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
    // 미정은 "" 로 정규화해 NOT NULL·NULL 스키마 모두 통과
    start_time: toSupabaseStartTime(row.start_time),
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

function normalizeInsertRow(row: SupabaseItineraryInsert): SupabaseItineraryInsert {
  return {
    ...row,
    start_time: toSupabaseStartTime(row.start_time),
  };
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

  // start_time null/"" 모두 Event.time = null 로 복원 (시간 미정)
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

  const payload = normalizeInsertRow(row);

  const { data, error, status } = await client
    .from("itineraries")
    .insert(payload)
    .select();

  console.log("[Supabase Query] itineraries.insert", {
    trip_id: payload.trip_id,
    id: payload.id,
    start_time: payload.start_time,
    title: payload.title,
    success: !error,
    status: status ?? null,
    error: error
      ? {
          message: error.message ?? null,
          code: error.code ?? null,
          details: error.details ?? null,
        }
      : null,
    returnedIds: Array.isArray(data)
      ? data.map((item) => (item as { id?: string }).id)
      : null,
  });
  logSupabaseQueryResult("itineraries.insert", { row: payload, data }, error);
  if (error) throw error;
}

/** 일정 수정 */
export async function updateSupabaseItinerary(
  id: string,
  row: SupabaseItineraryInsert,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");
  const updateRow = itineraryInsertToUpdate(row);

  const { error, status } = await client
    .from("itineraries")
    .update(updateRow)
    .eq("id", id);

  logSupabaseQueryResult(
    "itineraries.update",
    { itineraryId: id, row: updateRow, status },
    error,
  );
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

  await Promise.all(
    inserts.map((id) => insertSupabaseItinerary(nextMap.get(id)!)),
  );

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
  ).values()].map(normalizeInsertRow);

  const { data, error } = await client.from("itineraries").insert(rows).select();

  logSupabaseQueryResult("itineraries.migrate", { tripId, tripDates, rows, data }, error);
  if (error) throw error;

  return migratedEvents;
}
