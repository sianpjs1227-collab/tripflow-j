import type { Place, PlaceCategory } from "@/types/place";
import { getPlaceCoordinates, type GeoPosition } from "@/lib/directions";

/** 내 주변 추천 카테고리 표시 순서 */
export const nearbyCategoryOrder: PlaceCategory[] = [
  "restaurant_bar",
  "cafe_dessert",
  "shopping",
  "accommodation",
  "sightseeing",
  "other",
];

export type NearbyRadiusOption = 300 | 500 | 1000 | "all";

export const nearbyRadiusOptions: {
  value: NearbyRadiusOption;
  label: string;
}[] = [
  { value: 300, label: "300m" },
  { value: 500, label: "500m" },
  { value: 1000, label: "1km" },
  { value: "all", label: "전체" },
];

export interface NearbyPlace extends Place {
  distanceMeters: number;
  walkingMinutes: number;
}

const EARTH_RADIUS_M = 6_371_000;
const WALKING_SPEED_M_PER_MIN = 5000 / 60;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Haversine 공식으로 두 좌표 사이 거리(m) 계산 */
export function calculateDistanceMeters(
  from: GeoPosition,
  to: GeoPosition,
): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

/** 도보 예상 시간(분) — 시속 약 5km 기준 */
export function estimateWalkingMinutes(distanceMeters: number): number {
  return Math.max(1, Math.ceil(distanceMeters / WALKING_SPEED_M_PER_MIN));
}

export function formatDistanceMeters(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  }
  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

/** 현재 위치 기준 주변 장소 필터·정렬 */
export function getNearbyPlaces(
  places: Place[],
  origin: GeoPosition,
  radius: NearbyRadiusOption,
): NearbyPlace[] {
  const maxDistance = radius === "all" ? null : radius;
  const results: NearbyPlace[] = [];

  for (const place of places) {
    const coords = getPlaceCoordinates(place);
    if (!coords) continue;

    const distanceMeters = calculateDistanceMeters(origin, coords);
    if (maxDistance != null && distanceMeters > maxDistance) continue;

    results.push({
      ...place,
      distanceMeters,
      walkingMinutes: estimateWalkingMinutes(distanceMeters),
    });
  }

  return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/** 카테고리별 그룹 (가까운 순 유지) */
export function groupNearbyPlacesByCategory(
  nearbyPlaces: NearbyPlace[],
): { category: PlaceCategory; places: NearbyPlace[] }[] {
  const groups = new Map<PlaceCategory, NearbyPlace[]>();

  for (const category of nearbyCategoryOrder) {
    groups.set(category, []);
  }

  for (const place of nearbyPlaces) {
    const list = groups.get(place.category) ?? groups.get("other")!;
    list.push(place);
  }

  return nearbyCategoryOrder
    .map((category) => ({
      category,
      places: groups.get(category) ?? [],
    }))
    .filter((group) => group.places.length > 0);
}
