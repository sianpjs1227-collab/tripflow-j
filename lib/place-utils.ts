import type { Place, PlaceCategory, PlaceInput, PlaceSource } from "@/types/place";
import { extractCoordsFromMapsLink } from "@/lib/maps-link-parser";
import { isPlaceVisited } from "@/lib/place-visit";

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

export function inferPlaceSource(place: Place): PlaceSource {
  if (place.source === "KML" || place.source === "MANUAL") {
    return place.source;
  }
  if (placeHasStoredCoordinates(place)) {
    return "KML";
  }
  return "MANUAL";
}

export function isKmlPlace(place: Place): boolean {
  return inferPlaceSource(place) === "KML";
}

/** 목록·검색·개수에 표시할 장소 (숨김 제외) */
export function isPlaceVisible(place: Place): boolean {
  return place.hidden !== true;
}

export function getVisiblePlaces(places: Place[]): Place[] {
  return places.filter(isPlaceVisible);
}

/**
 * 장소 삭제 — KML(My Maps)은 숨김, MANUAL은 완전 삭제.
 * Google My Maps 원본은 건드리지 않는다.
 */
export function removeOrHidePlace(places: Place[], placeId: string): Place[] {
  const target = places.find((place) => place.id === placeId);
  if (!target) return places;

  if (isKmlPlace(target)) {
    return places.map((place) =>
      place.id === placeId ? { ...place, hidden: true } : place,
    );
  }

  return places.filter((place) => place.id !== placeId);
}

export function generatePlaceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
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

/** 저장된 latitude/longitude 여부 (내 주변·거리 계산용) */
export function placeHasStoredCoordinates(place: Place): boolean {
  return (
    place.latitude != null &&
    place.longitude != null &&
    !Number.isNaN(place.latitude) &&
    !Number.isNaN(place.longitude)
  );
}

/** Google Maps 검색용 쿼리 (장소명 + 주소) */
export function getPlaceSearchQuery(place: Place): string {
  const parts = [place.name.trim(), place.address?.trim()].filter(Boolean);
  return parts.join(" ");
}

function resolveManualCoords(mapsLink?: string): {
  latitude?: number;
  longitude?: number;
} {
  if (!mapsLink) return {};

  const coords = extractCoordsFromMapsLink(mapsLink);
  if (!coords) return {};

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

/** 직접 추가(MANUAL) 장소 생성 */
export function createPlace(input: PlaceInput): Place {
  const mapsLink = input.mapsLink.trim() || undefined;
  const coords = resolveManualCoords(mapsLink);

  return {
    id: generatePlaceId(),
    source: "MANUAL",
    name: input.name.trim(),
    category: input.category,
    address: input.address.trim() || undefined,
    mapsLink,
    ...coords,
    memo: input.memo.trim() || undefined,
  };
}

/** 장소 수정 — KML 장소는 좌표·링크·source 유지 */
export function updatePlace(place: Place, input: PlaceInput): Place {
  if (isKmlPlace(place)) {
    return {
      ...place,
      name: input.name.trim(),
      category: input.category,
      memo: input.memo.trim() || undefined,
    };
  }

  const mapsLink = input.mapsLink.trim() || undefined;
  const coords = resolveManualCoords(mapsLink);

  return {
    ...place,
    source: "MANUAL",
    name: input.name.trim(),
    category: input.category,
    address: input.address.trim() || undefined,
    mapsLink,
    latitude: coords.latitude,
    longitude: coords.longitude,
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
  const coords = resolveManualCoords(trimmedLink);

  const existing = places.find((p) => p.name === trimmedName);
  if (existing) {
    const updated: Place = {
      ...existing,
      mapsLink: trimmedLink ?? existing.mapsLink,
      ...(trimmedLink ? coords : {}),
    };
    return {
      places: places.map((p) => (p.id === existing.id ? updated : p)),
      place: updated,
    };
  }

  const place: Place = {
    id: generatePlaceId(),
    source: "MANUAL",
    name: trimmedName,
    category: "other",
    mapsLink: trimmedLink,
    ...coords,
  };

  return { places: [...places, place], place };
}

export function getGoogleMapsUrlForPlace(place: Place): string | null {
  if (place.mapsLink?.trim()) {
    const link = place.mapsLink.trim();
    return link.startsWith("http") ? link : `https://${link}`;
  }

  if (placeHasStoredCoordinates(place)) {
    return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
  }

  const searchQuery = getPlaceSearchQuery(place);
  if (searchQuery) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
  }

  return null;
}

export function openGoogleMapsForPlace(place: Place): void {
  const url = getGoogleMapsUrlForPlace(place);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

/** 지도 링크·좌표·이름·주소 중 하나라도 있으면 지도 열기 가능 */
export function placeHasMaps(place: Place): boolean {
  return Boolean(
    place.mapsLink?.trim() ||
      placeHasStoredCoordinates(place) ||
      getPlaceSearchQuery(place),
  );
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

export function isPlaceUsedInEvents(
  placeId: string,
  eventPlaceIds: string[],
): boolean {
  return eventPlaceIds.includes(placeId);
}

/** 장소명 기준 실시간 검색 필터 */
export function filterPlacesByName(
  places: Place[],
  query: string,
): Place[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return places;
  return places.filter((place) =>
    place.name.toLowerCase().includes(trimmed),
  );
}

/** 카테고리·즐겨찾기·방문 상태 필터 (검색 전 단계) */
export function filterPlacesByActiveFilter(
  places: Place[],
  activeFilter: PlaceListFilter,
  favoriteIds: ReadonlySet<string>,
): Place[] {
  switch (activeFilter) {
    case "favorites":
      return places.filter((place) => favoriteIds.has(place.id));
    case "not_visited":
      return places.filter((place) => !isPlaceVisited(place));
    case "visited":
      return places.filter((place) => isPlaceVisited(place));
    case "rating_sort":
      return [...places].sort((a, b) => {
        const ratingA = a.visit?.rating ?? 0;
        const ratingB = b.visit?.rating ?? 0;
        return ratingB - ratingA;
      });
    default:
      return places;
  }
}

export type PlaceListFilter =
  | "all"
  | "favorites"
  | "not_visited"
  | "visited"
  | "rating_sort";
