import type { TripMemberRole } from "@/types/trip-member";

/** Supabase `trip_members` 테이블 행 */
export interface SupabaseTripMemberRow {
  id: string;
  trip_id: string;
  user_id: string;
  role: TripMemberRole;
  created_at: string;
}

export interface SupabaseTripMemberInsert {
  id?: string;
  trip_id: string;
  user_id: string;
  role: TripMemberRole;
}
