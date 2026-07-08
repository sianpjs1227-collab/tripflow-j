import type { ScheduleItem } from "@/types/schedule";
import type { Place } from "@/types/place";
import { openDirectionsToPlace } from "@/lib/directions";

function scheduleItemToPlace(item: ScheduleItem): Place {
  return {
    id: item.placeId,
    name: item.placeName,
    category: "other",
    mapsLink: item.mapsLink,
    latitude: item.latitude,
    longitude: item.longitude,
  };
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
