import type { Event } from "@/types/event";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** legacy event id → uuid 변환 (Supabase 마이그레이션용) */
export function prepareItinerariesForSupabaseMigration(
  localEvents: Event[],
): Event[] {
  return localEvents.map((event) => {
    if (UUID_RE.test(event.id)) return event;
    return { ...event, id: crypto.randomUUID() };
  });
}
