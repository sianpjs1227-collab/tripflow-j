import type { PlaceCategory } from "@/types/place";

/** Supabase `places` 테이블 행 */
export interface SupabasePlaceRow {
  id: string;
  trip_id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  category: PlaceCategory;
  memo: string | null;
  visited: boolean;
  visited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabasePlaceInsert {
  id: string;
  trip_id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  category: PlaceCategory;
  memo: string | null;
  visited: boolean;
  visited_at: string | null;
}

export interface SupabasePlaceUpdate {
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  category: PlaceCategory;
  memo: string | null;
  visited: boolean;
  visited_at: string | null;
  updated_at: string;
}
