import type { Event } from "@/types/event";
import type { Place } from "@/types/place";
import type { ScheduleInput, ScheduleItem } from "@/types/schedule";
import { getDefaultEventTitleForPlace, getPlaceById } from "@/lib/place-utils";

export function generateEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** @deprecated generateEventId 와 동일 — 기존 import 호환 */
export const generateScheduleId = generateEventId;

/** Event + Place → UI용 ScheduleItem */
export function toScheduleItem(
  event: Event,
  place: Place | undefined,
): ScheduleItem {
  return {
    id: event.id,
    date: event.date,
    time: event.time?.trim() || null,
    endTime: event.endTime,
    title: event.title,
    placeId: event.placeId,
    placeName: place?.name ?? "",
    mapsLink: place?.mapsLink,
    latitude: place?.latitude,
    longitude: place?.longitude,
    memo: event.memo,
  };
}

/** Event 목록을 UI용 ScheduleItem 목록으로 변환 */
export function toScheduleItems(
  events: Event[],
  places: Place[],
): ScheduleItem[] {
  return events.map((event) =>
    toScheduleItem(event, getPlaceById(places, event.placeId)),
  );
}

/** 폼 입력 → Event (placeId 로 Place 참조) */
export function buildEventFromInput(
  input: ScheduleInput,
  existingId?: string,
): Event {
  const time = input.time.trim() || null;
  const endTime = time ? input.endTime.trim() : "";
  return {
    id: existingId ?? generateEventId(),
    date: input.date,
    time,
    endTime: endTime || undefined,
    title: input.title.trim(),
    placeId: input.placeId,
    memo: input.memo.trim() || undefined,
  };
}

/** 후보 장소 → 일정 Event (날짜·시간만 입력) */
export function buildEventFromPlace(
  place: Place,
  date: string,
  time: string,
  endTime?: string,
): Event {
  const trimmedEnd = endTime?.trim();
  return {
    id: generateEventId(),
    date,
    time,
    endTime: trimmedEnd || undefined,
    title: getDefaultEventTitleForPlace(place),
    placeId: place.id,
  };
}
