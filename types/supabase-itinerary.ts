/** Supabase `itineraries` 테이블 행 */
export interface SupabaseItineraryRow {
  id: string;
  trip_id: string;
  place_id: string | null;
  day_number: number;
  /** HH:mm — null = 시간 미정. 구 DB(NOT NULL) 호환 시 빈 문자열로 저장될 수 있음 */
  start_time: string | null;
  end_time: string | null;
  title: string;
  memo: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SupabaseItineraryInsert {
  id: string;
  trip_id: string;
  place_id: string | null;
  day_number: number;
  /**
   * HH:mm — 시간 미정은 "" 로 저장 (NOT NULL 구스키마 호환).
   * DB에 null이 있어도 select 시 Event.time = null 로 복원.
   */
  start_time: string | null;
  end_time: string | null;
  title: string;
  memo: string | null;
  sort_order: number;
}

export interface SupabaseItineraryUpdate {
  place_id: string | null;
  day_number: number;
  /** HH:mm — 시간 미정은 "" */
  start_time: string | null;
  end_time: string | null;
  title: string;
  memo: string | null;
  sort_order: number;
  updated_at: string;
}
