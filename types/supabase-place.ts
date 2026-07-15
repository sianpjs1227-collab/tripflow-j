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
  /** My Maps/KML soft-hide — 마이그레이션 전 행은 없을 수 있음 */
  is_hidden?: boolean;
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
  is_hidden: boolean;
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
  is_hidden: boolean;
  updated_at: string;
}
