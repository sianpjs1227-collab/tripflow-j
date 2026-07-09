/**
 * UI 표시·폼용 일정 뷰 모델
 * 내부 Event + Place 를 화면에 맞게 펼친 형태입니다.
 * (기존 UI/모달 호환)
 */
export interface ScheduleItem {
  id: string;
  date: string;
  time: string;
  title: string;
  /** Place 참조 ID */
  placeId: string;
  /** UI 표시용 — Place.name */
  placeName: string;
  /** UI 표시용 — Place.mapsLink */
  mapsLink?: string;
  /** UI 표시용 — Place.latitude */
  latitude?: number;
  /** UI 표시용 — Place.longitude */
  longitude?: number;
  memo?: string;
}

/** 일정 추가/수정 폼 입력 (UI) — Place.placeId 참조 */
export interface ScheduleInput {
  date: string;
  time: string;
  title: string;
  /** 장소 탭 Place ID */
  placeId: string;
  memo: string;
}
