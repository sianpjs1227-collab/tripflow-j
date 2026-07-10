export interface SupabaseTripInviteRow {
  id: string;
  trip_id: string;
  token: string;
  created_by: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface SupabaseTripInviteInsert {
  trip_id: string;
  token: string;
  created_by: string;
  expires_at: string;
}
