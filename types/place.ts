/** 장소 카테고리 (TripFlow 표시 그룹) */
export type PlaceCategory =
  | "accommodation"
  | "restaurant_bar"
  | "cafe_dessert"
  | "shopping"
  | "sightseeing"
  | "other";

/**
 * 장소(Place) — 후보 장소 저장소
 * TripDetailData.places 에 저장되며 Event.placeId 로 참조됩니다.
 */
export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  mapsLink?: string;
  latitude?: number;
  longitude?: number;
  memo?: string;
}

export interface PlaceInput {
  name: string;
  category: PlaceCategory;
  mapsLink: string;
  memo: string;
}

export interface AddPlaceToScheduleInput {
  date: string;
  time: string;
}
