/** 장소 카테고리 (TripFlow 표시 그룹) */
export type PlaceCategory =
  | "accommodation"
  | "restaurant_bar"
  | "cafe_dessert"
  | "shopping"
  | "sightseeing"
  | "other";

/** 장소 출처 — Supabase Place 테이블 공통 모델용 */
export type PlaceSource = "KML" | "MANUAL";

/** 장소 방문 상태 */
export type PlaceVisitStatus = "not_visited" | "visited";

/** 개인 평점 (1~5) */
export type PlaceRating = 1 | 2 | 3 | 4 | 5;

/**
 * 장소 여행 기록 — 장소 자체 상태 (일정과 독립)
 * 향후 photoUrls·visitMemo 등 확장 가능
 */
export interface PlaceVisit {
  status: PlaceVisitStatus;
  /** ISO 8601 datetime — 방문 시각 */
  visitedAt?: string;
  /** 개인 평점 1~5 */
  rating?: PlaceRating;
  /** 여행 기록 한줄 메모 */
  recordMemo?: string;
  /** 향후 사진 URL 목록 */
  photoUrls?: string[];
}

/** 여행 기록 입력 폼 */
export interface PlaceTravelRecordInput {
  visited: boolean;
  /** datetime-local 값 (YYYY-MM-DDTHH:mm) */
  visitedAt: string;
  rating: PlaceRating | null;
  recordMemo: string;
}

/**
 * 장소(Place) — 후보 장소 저장소
 * TripDetailData.places 에 저장되며 Event.placeId 로 참조됩니다.
 */
export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  /** KML 가져오기 / 직접 추가 구분 */
  source?: PlaceSource;
  mapsLink?: string;
  /** 직접 추가(MANUAL) 시 선택 입력 */
  address?: string;
  latitude?: number;
  longitude?: number;
  memo?: string;
  /** 방문 상태 (없으면 방문안함) */
  visit?: PlaceVisit;
}

export interface PlaceInput {
  name: string;
  category: PlaceCategory;
  mapsLink: string;
  address: string;
  memo: string;
}

export interface AddPlaceToScheduleInput {
  date: string;
  time: string;
  /** 종료 시간 (선택) */
  endTime?: string;
}
