import { getSupabaseClient, logSupabaseQueryResult } from "@/lib/supabase";
import type { TripMember, TripMemberRole } from "@/types/trip-member";
import type {
  SupabaseTripMemberInsert,
  SupabaseTripMemberRow,
} from "@/types/supabase-trip-member";

export function supabaseRowToTripMember(
  row: SupabaseTripMemberRow,
): TripMember {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
  };
}

/** 현재 사용자의 멤버십 목록 */
export async function fetchSupabaseTripMembersByUserId(
  userId: string,
): Promise<TripMember[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client
    .from("trip_members")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  logSupabaseQueryResult("trip_members.select_by_user", { userId, data }, error);
  if (error) throw error;

  return (data as SupabaseTripMemberRow[]).map(supabaseRowToTripMember);
}

/** 특정 여행의 멤버십 목록 (owner 관리용 — 초대 UI 전 기반) */
export async function fetchSupabaseTripMembersByTripId(
  tripId: string,
): Promise<TripMember[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client
    .from("trip_members")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });

  logSupabaseQueryResult("trip_members.select_by_trip", { tripId, data }, error);
  if (error) throw error;

  return (data as SupabaseTripMemberRow[]).map(supabaseRowToTripMember);
}

/** 현재 사용자의 해당 여행 역할 */
export async function fetchMyTripMemberRole(
  tripId: string,
  userId: string,
): Promise<TripMemberRole | null> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client
    .from("trip_members")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .maybeSingle();

  logSupabaseQueryResult(
    "trip_members.select_my_role",
    { tripId, userId, data },
    error,
  );
  if (error) throw error;

  return (data as { role: TripMemberRole } | null)?.role ?? null;
}

/** 멤버 등록 (현재 단계: owner 자동 등록용) */
export async function insertSupabaseTripMember(
  tripId: string,
  userId: string,
  role: TripMemberRole = "owner",
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const row: SupabaseTripMemberInsert = {
    trip_id: tripId,
    user_id: userId,
    role,
  };

  const { data, error } = await client
    .from("trip_members")
    .insert(row)
    .select();

  logSupabaseQueryResult(
    "trip_members.insert",
    { tripId, userId, role, data },
    error,
  );
  if (error) throw error;
}

/** 여러 여행에 대해 owner 멤버십 일괄 등록 (마이그레이션용) */
export async function insertSupabaseTripOwners(
  userId: string,
  tripIds: string[],
): Promise<void> {
  if (tripIds.length === 0) return;

  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const rows: SupabaseTripMemberInsert[] = tripIds.map((tripId) => ({
    trip_id: tripId,
    user_id: userId,
    role: "owner",
  }));

  const { data, error } = await client
    .from("trip_members")
    .upsert(rows, { onConflict: "trip_id,user_id", ignoreDuplicates: true })
    .select();

  logSupabaseQueryResult(
    "trip_members.insert_owners",
    { userId, tripIds, data },
    error,
  );
  if (error) throw error;
}
