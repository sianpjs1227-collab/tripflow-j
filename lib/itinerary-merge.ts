import { sortEvents } from "@/lib/schedule-utils";
import type { Event } from "@/types/event";

/**
 * remote + local-only(미동기화) 일정 merge.
 * - 동일 id: remote 우선
 * - local에만 있는 id: 유지 (pending)
 */
export function mergeRemoteAndLocalEvents(
  remoteEvents: Event[],
  localEvents: Event[],
): Event[] {
  const byId = new Map<string, Event>();

  for (const event of remoteEvents) {
    byId.set(event.id, event);
  }

  for (const event of localEvents) {
    if (!byId.has(event.id)) {
      byId.set(event.id, event);
    }
  }

  return sortEvents([...byId.values()]);
}

/** local에만 있고 remote에 없는 일정 (미동기화 pending) */
export function getLocalOnlyEvents(
  remoteEvents: Event[],
  localEvents: Event[],
): Event[] {
  const remoteIds = new Set(remoteEvents.map((event) => event.id));
  return localEvents.filter((event) => !remoteIds.has(event.id));
}
