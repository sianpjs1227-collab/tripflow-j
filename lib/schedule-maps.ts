import type { ScheduleItem } from "@/types/schedule";
import type { Place } from "@/types/place";
import { openDirectionsToPlace } from "@/lib/directions";
import { getGoogleMapsUrlForPlace } from "@/lib/place-utils";

export function scheduleItemToPlace(item: ScheduleItem): Place {
  return {
    id: item.placeId,
    name: item.placeName,
    category: "other",
    mapsLink: item.mapsLink,
    latitude: item.latitude,
    longitude: item.longitude,
  };
}

/** 일정 장소 Google Maps 열기 */
export function openMapsForScheduleItem(item: ScheduleItem): void {
  const url = getGoogleMapsUrlForPlace(scheduleItemToPlace(item));
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

/** 현재 위치에서 일정 장소까지 길찾기 */
export async function openDirectionsForScheduleItem(
  item: ScheduleItem,
): Promise<void> {
  if (!item.placeName.trim() && !item.mapsLink && item.latitude == null) {
    return;
  }

  await openDirectionsToPlace(scheduleItemToPlace(item));
}

/** 지도 링크 또는 좌표가 있는지 */
export function scheduleItemHasMaps(item: ScheduleItem): boolean {
  return Boolean(
    item.mapsLink?.trim() ||
      (item.latitude != null && item.longitude != null) ||
      item.placeName.trim(),
  );
}
