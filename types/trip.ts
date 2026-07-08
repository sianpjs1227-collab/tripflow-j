/**
 * 여행의 진행 상태를 나타내는 타입
 */
export type TripStatus = "planning" | "preparing" | "completed";

/**
 * 여행 상세 페이지 탭 종류
 */
export type TripTab =
  | "schedule"
  | "places"
  | "budget"
  | "checklist"
  | "memo";

/**
 * 앱에서 사용하는 여행 메타데이터
 *
 * 상세 데이터(일정·장소·지출·체크리스트·메모)는
 * TripDetailData 로 tripId 기준 localStorage 에 저장됩니다.
 * @see types/trip-detail.ts
 */
export interface Trip {
  id: string;
  /** 여행명 (미입력 시 도시명) */
  name: string;
  /** 도시명 */
  city: string;
  /** 국가명 (예: 일본) */
  country: string;
  /** ISO 국가 코드 (내부 저장용, 화면에 표시하지 않음) */
  countryCode: string;
  /** Unicode 국기 이모지 */
  flag: string;
  /** 출발일 (표시용, 예: 2026.03.14) */
  startDate: string;
  /** 귀국일 (표시용) */
  endDate: string;
  /** 숙박 일수 (예: 3박4일) */
  duration: string;
  status: TripStatus;
}

/** 새 여행 입력 폼 데이터 */
export interface CreateTripInput {
  /** 선택 입력 — 비우면 도시명이 여행명이 됩니다 */
  name: string;
  /** 국가 코드 (예: JP) */
  countryCode: string;
  city: string;
  startDate: string;
  endDate: string;
}
