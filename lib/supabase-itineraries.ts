import {
  buildItineraryPayloadMap,
  itineraryPayloadsEqual,
  itineraryRowToEvent,
} from "@/lib/itinerary-map";
import { prepareItinerariesForSupabaseMigration } from "@/lib/itinerary-migration";
import { getSupabaseClient } from "@/lib/supabase";
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

  const { error } = await client.from("itineraries").insert(row);

  if (error) throw error;
}

/** 일정 수정 */
export async function updateSupabaseItinerary(
  id: string,
  row: SupabaseItineraryInsert,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client
    .from("itineraries")
    .update(itineraryInsertToUpdate(row))
    .eq("id", id);

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

  const { error } = await client.from("itineraries").insert(rows);

  if (error) throw error;

  return migratedEvents;
}
