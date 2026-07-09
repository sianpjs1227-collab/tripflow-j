/** Supabase `itineraries` 테이블 행 */
export interface SupabaseItineraryRow {
  id: string;
  trip_id: string;
  place_id: string | null;
  day_number: number;
  start_time: string;
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
  start_time: string;
  end_time: string | null;
  title: string;
  memo: string | null;
  sort_order: number;
}

export interface SupabaseItineraryUpdate {
  place_id: string | null;
  day_number: number;
  start_time: string;
  end_time: string | null;
  title: string;
  memo: string | null;
  sort_order: number;
  updated_at: string;
}
