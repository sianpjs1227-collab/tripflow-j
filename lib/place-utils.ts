import type { Place, PlaceCategory, PlaceInput } from "@/types/place";

export const placeCategoryLabels: Record<PlaceCategory, string> = {
  accommodation: "숙소",
  restaurant_bar: "식당·술집",
  cafe_dessert: "카페·디저트",
  shopping: "쇼핑",
  sightseeing: "관광지",
  other: "기타",
};

export const placeCategoryIcons: Record<PlaceCategory, string> = {
  accommodation: "🏨",
  restaurant_bar: "🍜",
  cafe_dessert: "☕",
  shopping: "🛍",
  sightseeing: "📷",
  other: "📍",
};

/** 장소 탭 그룹 표시 순서 */
export const placeCategoryOrder: PlaceCategory[] = [
  "accommodation",
  "restaurant_bar",
  "cafe_dessert",
  "shopping",
  "sightseeing",
  "other",
];

export const placeCategories: PlaceCategory[] = placeCategoryOrder;

/** 이전 카테고리 값 → 새 카테고리 (localStorage 마이그레이션) */
export const legacyCategoryMap: Record<string, PlaceCategory> = {
  restaurant: "restaurant_bar",
  cafe: "cafe_dessert",
  sightseeing: "sightseeing",
  shopping: "shopping",
  accommodation: "accommodation",
  other: "other",
};

export function normalizePlaceCategory(
  category: string | undefined,
): PlaceCategory {
  if (!category) return "other";
  if (category in placeCategoryLabels) {
    return category as PlaceCategory;
  }
  return legacyCategoryMap[category] ?? "other";
}

export function generatePlaceId(): string {
  return `place-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getPlaceById(
  places: Place[],
  placeId: string,
): Place | undefined {
  return places.find((p) => p.id === placeId);
}

export function truncateMemo(memo: string, maxLength = 40): string {
  const trimmed = memo.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
}

export function getDefaultEventTitleForPlace(place: Place): string {
  if (place.category !== "other") {
    return placeCategoryLabels[place.category];
  }
  return place.name;
}

export function createPlace(input: PlaceInput): Place {
  return {
    id: generatePlaceId(),
    name: input.name.trim(),
    category: input.category,
    mapsLink: input.mapsLink.trim() || undefined,
    memo: input.memo.trim() || undefined,
  };
}

export function updatePlace(place: Place, input: PlaceInput): Place {
  return {
    ...place,
    name: input.name.trim(),
    category: input.category,
    mapsLink: input.mapsLink.trim() || undefined,
    memo: input.memo.trim() || undefined,
  };
}

export function upsertPlace(
  places: Place[],
  name: string,
  mapsLink?: string,
): { places: Place[]; place: Place } {
  const trimmedName = name.trim();
  const trimmedLink = mapsLink?.trim() || undefined;

  const existing = places.find((p) => p.name === trimmedName);
  if (existing) {
    const updated: Place = {
      ...existing,
      mapsLink: trimmedLink ?? existing.mapsLink,
    };
    return {
      places: places.map((p) => (p.id === existing.id ? updated : p)),
      place: updated,
    };
  }

  const place: Place = {
    id: generatePlaceId(),
    name: trimmedName,
    category: "other",
    mapsLink: trimmedLink,
  };

  return { places: [...places, place], place };
}

export function getGoogleMapsUrlForPlace(place: Place): string | null {
  if (place.mapsLink?.trim()) {
    const link = place.mapsLink.trim();
    return link.startsWith("http") ? link : `https://${link}`;
  }

  if (
    place.latitude != null &&
    place.longitude != null &&
    !Number.isNaN(place.latitude) &&
    !Number.isNaN(place.longitude)
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
  }

  if (place.name.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name.trim())}`;
  }

  return null;
}

export function openGoogleMapsForPlace(place: Place): void {
  const url = getGoogleMapsUrlForPlace(place);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

export function isPlaceUsedInEvents(
  placeId: string,
  eventPlaceIds: string[],
): boolean {
  return eventPlaceIds.includes(placeId);
}

/** 카테고리별로 장소 그룹핑 (빈 카테고리 제외) */
export function groupPlacesByCategory(
  places: Place[],
): { category: PlaceCategory; places: Place[] }[] {
  const groups = new Map<PlaceCategory, Place[]>();

  for (const category of placeCategoryOrder) {
    groups.set(category, []);
  }

  for (const place of places) {
    const list = groups.get(place.category) ?? groups.get("other")!;
    list.push(place);
  }

  return placeCategoryOrder
    .map((category) => ({
      category,
      places: groups.get(category) ?? [],
    }))
    .filter((group) => group.places.length > 0);
}
