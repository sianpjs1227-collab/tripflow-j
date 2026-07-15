import type { Event } from "@/types/event";
import { groupEventsByDate } from "@/lib/schedule-utils";
import type {
  SupabaseItineraryInsert,
  SupabaseItineraryRow,
} from "@/types/supabase-itinerary";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isItineraryUuid(id: string): boolean {
  return UUID_RE.test(id);
}

/** 일정별 sort_order 계산 (날짜·시간 순) */
export function computeItinerarySortOrders(
  events: Event[],
): Map<string, number> {
  const orders = new Map<string, number>();

  for (const group of groupEventsByDate(events)) {
    group.items.forEach((event, index) => {
      orders.set(event.id, index);
    });
  }

  return orders;
}

export function resolveEventDayNumber(
  event: Event,
  tripDates: string[],
): number {
  const dayIndex = tripDates.indexOf(event.date);
  return dayIndex >= 0 ? dayIndex + 1 : 1;
}

export function resolveDayNumberToDate(
  dayNumber: number,
  tripDates: string[],
): string {
  return tripDates[dayNumber - 1] ?? tripDates[0] ?? "";
}

function resolvePlaceId(
  placeId: string,
  validPlaceIds: ReadonlySet<string>,
): string | null {
  if (!placeId.trim()) return null;
  return validPlaceIds.has(placeId) ? placeId : null;
}

/**
 * Event.time → itineraries.start_time
 * - 시간 지정: "HH:mm"
 * - 시간 미정: "" (NOT NULL DB에서도 insert 가능; null은 23502 유발)
 *   select 시 fromSupabaseStartTime 으로 Event.time = null 복원
 */
export function toSupabaseStartTime(
  time: string | null | undefined,
): string {
  return time?.trim() || "";
}

/** DB start_time → Event.time (null/빈문자 모두 시간 미정) */
export function fromSupabaseStartTime(
  startTime: string | null | undefined,
): string | null {
  return startTime?.trim() || null;
}

/** Event → Supabase itineraries 행 */
export function eventToItineraryInsert(
  event: Event,
  tripId: string,
  tripDates: string[],
  sortOrder: number,
  validPlaceIds: ReadonlySet<string>,
): SupabaseItineraryInsert {
  const startTime = toSupabaseStartTime(event.time);

  return {
    id: event.id,
    trip_id: tripId,
    place_id: resolvePlaceId(event.placeId, validPlaceIds),
    day_number: resolveEventDayNumber(event, tripDates),
    // 시간 미정은 "" — null 금지(구스키마 NOT NULL 대응)
    start_time: startTime,
    end_time: startTime ? event.endTime?.trim() || null : null,
    title: event.title,
    memo: event.memo ?? null,
    sort_order: sortOrder,
  };
}

/** Supabase itineraries 행 → Event */
export function itineraryRowToEvent(
  row: SupabaseItineraryRow,
  tripDates: string[],
): Event {
  return {
    id: row.id,
    date: resolveDayNumberToDate(row.day_number, tripDates),
    time: fromSupabaseStartTime(row.start_time),
    endTime: row.end_time?.trim() || undefined,
    title: row.title,
    placeId: row.place_id ?? "",
    memo: row.memo ?? undefined,
  };
}

export function buildItineraryPayloadMap(
  events: Event[],
  tripId: string,
  tripDates: string[],
  validPlaceIds: ReadonlySet<string>,
): Map<string, SupabaseItineraryInsert> {
  const sortOrders = computeItinerarySortOrders(events);
  const map = new Map<string, SupabaseItineraryInsert>();

  for (const event of events) {
    map.set(
      event.id,
      eventToItineraryInsert(
        event,
        tripId,
        tripDates,
        sortOrders.get(event.id) ?? 0,
        validPlaceIds,
      ),
    );
  }

  return map;
}

export function itineraryPayloadsEqual(
  a: SupabaseItineraryInsert,
  b: SupabaseItineraryInsert,
): boolean {
  return (
    a.trip_id === b.trip_id &&
    a.place_id === b.place_id &&
    a.day_number === b.day_number &&
    toSupabaseStartTime(a.start_time) === toSupabaseStartTime(b.start_time) &&
    a.end_time === b.end_time &&
    a.title === b.title &&
    a.memo === b.memo &&
    a.sort_order === b.sort_order
  );
}
