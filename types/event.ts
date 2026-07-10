/**
 * 일정(Event)
 * 장소명 문자열 대신 Place.id(placeId)를 참조합니다.
 */
export interface Event {
  id: string;
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 시작 시간 (HH:mm) */
  time: string;
  /** 종료 시간 (HH:mm, 선택) */
  endTime?: string;
  /** 일정 제목 */
  title: string;
  /** Place 참조 ID */
  placeId: string;
  /** 메모 (선택) */
  memo?: string;
}
