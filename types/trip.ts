/**
 * Trip 환율 모드 / 제공자
 */
export type ExchangeRateMode = "startDate" | "current" | "manual";
export type ExchangeRateProvider = "koreaexim" | "manual";

/**
 * 여행 라이프사이클 상태 (Supabase Trip.status)
 */
export type TripStatus = "PLANNING" | "TRAVELING" | "COMPLETED";

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
  /** true 이면 status 를 자동 계산하지 않음 */
  statusIsManual?: boolean;
  /** 여행 기본 통화 (예: JPY, USD, KRW) — 국가 기준 자동 설정 */
  currency: string;
  /** 1 외화 = N KRW — null 이면 원화(KRW) 여행 또는 미설정 */
  exchangeRate: number | null;
  /**
   * 환율 적용 방식
   * - startDate: 여행 시작일 환율
   * - current: 현재 환율
   * - manual: 직접 입력
   */
  exchangeRateMode?: ExchangeRateMode | null;
  /** 환율 기준일 (YYYY-MM-DD) */
  exchangeRateDate?: string | null;
  /** 표시 단위 (1 또는 100) — JPY/VND 등 */
  exchangeRateUnit?: number | null;
  /** 환율 출처 */
  exchangeRateProvider?: ExchangeRateProvider | null;
  /** @deprecated exchangeRateDate 로 대체 — 하위 호환 */
  exchangeRateUpdatedAt?: string | null;
  /** 커버 이미지 (data URL, 선택) */
  coverImage?: string;
  /** Google My Maps map id (mid) */
  myMapsMapId?: string | null;
  /** Google My Maps viewer/share URL */
  myMapsViewerUrl?: string | null;
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
  /** 환율 적용 방식 */
  exchangeRateMode: ExchangeRateMode;
  /**
   * 저장용: 1 기본통화 = N KRW
   * 직접 입력 UI에서는 단위(100 등) 기준 금액을 받아 변환한다.
   */
  exchangeRate: string;
  /** 환율 기준일 (YYYY-MM-DD) */
  exchangeRateDate?: string | null;
  /** 표시 단위 */
  exchangeRateUnit?: number | null;
  /** 환율 출처 */
  exchangeRateProvider?: ExchangeRateProvider | null;
  /** @deprecated */
  exchangeRateUpdatedAt?: string | null;
  /** 커버 이미지 (data URL, 선택) */
  coverImage?: string;
  /** 새 여행 생성 시 기본 체크리스트 포함 (기본값 true) */
  includeDefaultChecklist?: boolean;
}
