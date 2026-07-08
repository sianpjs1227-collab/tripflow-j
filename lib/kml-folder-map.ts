import type { PlaceCategory } from "@/types/place";

/**
 * Google My Maps Folder 이름 → TripFlow 카테고리
 */
export const KML_FOLDER_CATEGORY_MAP: Record<string, PlaceCategory> = {
  "0. 후쿠오카_숙소": "accommodation",
  "1. 후쿠오카_식당, 술집": "restaurant_bar",
  "2. 후쿠오카_카페, 디저트": "cafe_dessert",
  "3. 후쿠오카_쇼핑": "shopping",
  "4. 후쿠오카_가볼만한 곳": "sightseeing",
  "공유받은 후쿠오카 맛집리스트": "restaurant_bar",
};

/** KML Folder 이름을 카테고리로 변환 */
export function folderNameToCategory(folderName: string): PlaceCategory {
  const trimmed = folderName.trim();

  if (KML_FOLDER_CATEGORY_MAP[trimmed]) {
    return KML_FOLDER_CATEGORY_MAP[trimmed];
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes("숙소")) return "accommodation";
  if (
    lower.includes("식당") ||
    lower.includes("술집") ||
    lower.includes("맛집")
  ) {
    return "restaurant_bar";
  }
  if (lower.includes("카페") || lower.includes("디저트")) {
    return "cafe_dessert";
  }
  if (lower.includes("쇼핑")) return "shopping";
  if (lower.includes("가볼만한") || lower.includes("관광")) {
    return "sightseeing";
  }

  return "other";
}
