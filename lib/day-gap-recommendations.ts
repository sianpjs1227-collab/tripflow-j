import type { Place, PlaceCategory } from "@/types/place";
import type { ScheduleItem } from "@/types/schedule";
import type { GeoPosition } from "@/lib/directions";
import type { DayGap } from "@/lib/day-schedule-utils";
import {
  getGapAnchor,
  getPreviousScheduleItemForGap,
} from "@/lib/day-schedule-utils";
import {
  calculateDistanceMeters,
  estimateWalkingMinutes,
  formatDistanceMeters,
} from "@/lib/nearby-utils";
import { getPlaceById, isKmlPlace, placeHasStoredCoordinates } from "@/lib/place-utils";

export const MAX_GAP_RECOMMENDATIONS = 3;
const RECOMMENDATION_RADIUS_M = 2_000;

export type GapCategoryFilter = "all" | PlaceCategory;

/** 빈 시간 추천 카테고리 탭 */
export const gapRecommendationTabs: {
  filter: GapCategoryFilter;
  label: string;
}[] = [
  { filter: "all", label: "전체" },
  { filter: "cafe_dessert", label: "카페" },
  { filter: "restaurant_bar", label: "식당·술집" },
  { filter: "shopping", label: "쇼핑" },
  { filter: "sightseeing", label: "관광" },
  { filter: "accommodation", label: "숙소" },
];

export interface GapRecommendedPlace extends Place {
  distanceMeters: number;
  walkingMinutes: number;
  distanceLabel: string;
}

/** 직전 일정 카테고리 이후 추천 우선순위 (앞일수록 우선) */
export const gapCategoryPriorityAfter: Record<PlaceCategory, PlaceCategory[]> = {
  restaurant_bar: [
    "cafe_dessert",
    "shopping",
    "sightseeing",
    "accommodation",
    "other",
    "restaurant_bar",
  ],
  cafe_dessert: [
    "shopping",
    "sightseeing",
    "restaurant_bar",
    "accommodation",
    "other",
    "cafe_dessert",
  ],
  shopping: [
    "cafe_dessert",
    "restaurant_bar",
    "sightseeing",
    "accommodation",
    "other",
    "shopping",
  ],
  sightseeing: [
    "cafe_dessert",
    "shopping",
    "restaurant_bar",
    "accommodation",
    "other",
    "sightseeing",
  ],
  accommodation: [
    "restaurant_bar",
    "cafe_dessert",
    "shopping",
    "sightseeing",
    "other",
    "accommodation",
  ],
  other: [
    "cafe_dessert",
    "restaurant_bar",
    "shopping",
    "sightseeing",
    "accommodation",
    "other",
  ],
};

function getCategoryPriorityRank(
  category: PlaceCategory,
  previousCategory: PlaceCategory | null,
): number {
  if (!previousCategory) return 0;
  const order = gapCategoryPriorityAfter[previousCategory];
  const index = order.indexOf(category);
  return index === -1 ? order.length : index;
}

/** 빈 시간 직전 일정의 장소 카테고리 */
export function getPreviousPlaceCategory(
  gap: DayGap,
  dayItems: ScheduleItem[],
  places: Place[],
): PlaceCategory | null {
  const previousItem = getPreviousScheduleItemForGap(gap, dayItems);
  if (!previousItem?.placeId) return null;

  const place = getPlaceById(places, previousItem.placeId);
  return place?.category ?? null;
}

/** KML 장소 중 빈 시간 근처 후보 (거리순, 제한 없음) */
export function getGapRecommendations(
  gap: DayGap,
  dayItems: ScheduleItem[],
  allPlaces: Place[],
  scheduledPlaceIds: Set<string>,
  userPosition?: GeoPosition | null,
): GapRecommendedPlace[] {
  const anchor = getGapAnchor(gap, dayItems, userPosition);
  if (!anchor) return [];

  const candidates = allPlaces.filter(
    (place) =>
      isKmlPlace(place) &&
      placeHasStoredCoordinates(place) &&
      !scheduledPlaceIds.has(place.id),
  );

  const results: GapRecommendedPlace[] = [];

  for (const place of candidates) {
    const coords: GeoPosition = {
      latitude: place.latitude!,
      longitude: place.longitude!,
    };
    const distanceMeters = calculateDistanceMeters(anchor, coords);
    if (distanceMeters > RECOMMENDATION_RADIUS_M) continue;

    results.push({
      ...place,
      distanceMeters,
      walkingMinutes: estimateWalkingMinutes(distanceMeters),
      distanceLabel: formatDistanceMeters(distanceMeters),
    });
  }

  return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/** 카테고리 필터·우선순위 적용 후 상위 N개 */
export function applyGapRecommendationFilter(
  recommendations: GapRecommendedPlace[],
  filter: GapCategoryFilter,
  previousCategory: PlaceCategory | null,
  limit = MAX_GAP_RECOMMENDATIONS,
): GapRecommendedPlace[] {
  let filtered =
    filter === "all"
      ? recommendations
      : recommendations.filter((place) => place.category === filter);

  if (filter === "all" && previousCategory) {
    filtered = [...filtered].sort((a, b) => {
      const priorityDiff =
        getCategoryPriorityRank(a.category, previousCategory) -
        getCategoryPriorityRank(b.category, previousCategory);
      if (priorityDiff !== 0) return priorityDiff;
      return a.distanceMeters - b.distanceMeters;
    });
  } else {
    filtered = [...filtered].sort(
      (a, b) => a.distanceMeters - b.distanceMeters,
    );
  }

  return filtered.slice(0, limit);
}

/** 직전 일정 카테고리 기반 기본 탭 (결과가 있는 첫 우선 카테고리) */
export function getDefaultGapCategoryFilter(
  gap: DayGap,
  dayItems: ScheduleItem[],
  places: Place[],
  recommendations: GapRecommendedPlace[],
): GapCategoryFilter {
  const previousCategory = getPreviousPlaceCategory(gap, dayItems, places);
  if (!previousCategory) return "all";

  const priorityOrder = gapCategoryPriorityAfter[previousCategory];
  for (const category of priorityOrder) {
    if (recommendations.some((place) => place.category === category)) {
      return category;
    }
  }

  return "all";
}
