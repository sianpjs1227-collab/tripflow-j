import type { TripStatus } from "@/types/trip";

/** Supabase `trips` 테이블 행 */
export interface SupabaseTripRow {
  id: string;
  user_id: string;
  title: string;
  country: string;
  city: string;
  start_date: string;
  end_date: string;
  status: TripStatus;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseTripInsert {
  id: string;
  user_id: string;
  title: string;
  country: string;
  city: string;
  start_date: string;
  end_date: string;
  status: TripStatus;
  cover_image: string | null;
}

export interface SupabaseTripUpdate {
  title: string;
  country: string;
  city: string;
  start_date: string;
  end_date: string;
  status: TripStatus;
  cover_image: string | null;
  updated_at: string;
}
