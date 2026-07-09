import type { ScheduleItem } from "@/types/schedule";
import type { GeoPosition } from "@/lib/directions";

export const MIN_GAP_HOURS = 2;

export interface DayGap {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  durationLabel: string;
}

/** HH:mm → 분 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/** 분 → HH:mm */
export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 빈 시간 길이 표시 (예: 6시간, 2시간 30분) */
export function formatGapDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}시간 ${mins}분`;
  if (hours > 0) return `${hours}시간`;
  return `${mins}분`;
}

/** 일정 항목에서 좌표 추출 */
export function getScheduleItemCoords(
  item: ScheduleItem,
): GeoPosition | null {
  if (
    item.latitude != null &&
    item.longitude != null &&
    !Number.isNaN(item.latitude) &&
    !Number.isNaN(item.longitude)
  ) {
    return { latitude: item.latitude, longitude: item.longitude };
  }
  return null;
}

/** 장소가 등록된 일정만 시간순 */
export function getDayRouteItems(items: ScheduleItem[]): ScheduleItem[] {
  return [...items]
    .filter((item) => item.placeId && item.placeName.trim())
    .sort((a, b) => a.time.localeCompare(b.time));
}

/** Day 경로용 Google Maps URL (시간순 경유지) */
export function buildDayRouteUrl(items: ScheduleItem[]): string | null {
  const routeItems = getDayRouteItems(items);
  if (routeItems.length === 0) return null;

  const stops = routeItems.map((item) => {
    const coords = getScheduleItemCoords(item);
    if (coords) {
      return `${coords.latitude},${coords.longitude}`;
    }
    return encodeURIComponent(item.placeName.trim());
  });

  if (stops.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&destination=${stops[0]}`;
  }

  const params = new URLSearchParams({
    api: "1",
    origin: stops[0],
    destination: stops[stops.length - 1],
  });

  const waypoints = stops.slice(1, -1).join("|");
  if (waypoints) {
    params.set("waypoints", waypoints);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** 연속 일정 사이 빈 시간 분석 */
export function analyzeDayGaps(items: ScheduleItem[]): DayGap[] {
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
  const gaps: DayGap[] = [];
  const minGapMinutes = MIN_GAP_HOURS * 60;

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const startMin = timeToMinutes(sorted[i].time);
    const endMin = timeToMinutes(sorted[i + 1].time);
    const durationMinutes = endMin - startMin;

    if (durationMinutes >= minGapMinutes) {
      gaps.push({
        startTime: sorted[i].time,
        endTime: sorted[i + 1].time,
        durationMinutes,
        durationLabel: formatGapDuration(durationMinutes),
      });
    }
  }

  return gaps;
}

/** 빈 시간 중간 시각 (일정 추가 제안용) */
export function suggestTimeInGap(gap: DayGap): string {
  const startMin = timeToMinutes(gap.startTime);
  const endMin = timeToMinutes(gap.endTime);
  const mid = Math.round((startMin + endMin) / 2);
  const rounded = Math.round(mid / 30) * 30;
  return minutesToTime(rounded);
}

/** 빈 시간 직전 일정 항목 */
export function getPreviousScheduleItemForGap(
  gap: DayGap,
  items: ScheduleItem[],
): ScheduleItem | null {
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));

  for (let i = 0; i < sorted.length - 1; i += 1) {
    if (
      sorted[i].time === gap.startTime &&
      sorted[i + 1].time === gap.endTime
    ) {
      return sorted[i];
    }
  }

  return null;
}

/** 빈 시간 기준점 — 이전·다음 일정 장소 좌표 */
export function getGapAnchor(
  gap: DayGap,
  items: ScheduleItem[],
  userPosition?: GeoPosition | null,
): GeoPosition | null {
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));

  for (let i = 0; i < sorted.length - 1; i += 1) {
    if (sorted[i].time !== gap.startTime) continue;

    const prevCoords = getScheduleItemCoords(sorted[i]);
    if (prevCoords) return prevCoords;

    const nextCoords = getScheduleItemCoords(sorted[i + 1]);
    if (nextCoords) return nextCoords;
    break;
  }

  for (const item of sorted) {
    const coords = getScheduleItemCoords(item);
    if (coords) return coords;
  }

  return userPosition ?? null;
}
