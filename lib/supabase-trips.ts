import { getCurrencyCodeByCountryCode, getCountryFlag } from "@/data/countries";
import { assignUuidToTripForMigration } from "@/lib/trip-migration";
import { getSupabaseClient, logSupabaseQueryResult } from "@/lib/supabase";
import {
  insertSupabaseTripMember,
  insertSupabaseTripOwners,
} from "@/lib/supabase-trip-members";
import {
  calculateDuration,
  displayDateToIso,
  formatDisplayDate,
  getCountryCodeByName,
  normalizeTrip,
} from "@/lib/trip-utils";
import type { Trip } from "@/types/trip";
import type {
  SupabaseTripInsert,
  SupabaseTripRow,
  SupabaseTripUpdate,
} from "@/types/supabase-trip";

function tripToSupabaseInsert(trip: Trip, userId: string): SupabaseTripInsert {
  return {
    id: trip.id,
    user_id: userId,
    title: trip.name,
    country: trip.country,
    city: trip.city,
    start_date: displayDateToIso(trip.startDate),
    end_date: displayDateToIso(trip.endDate),
    cover_image: trip.coverImage ?? null,
    status: trip.status,
  };
}

function tripToSupabaseUpdate(trip: Trip): SupabaseTripUpdate {
  return {
    title: trip.name,
    country: trip.country,
    city: trip.city,
    start_date: displayDateToIso(trip.startDate),
    end_date: displayDateToIso(trip.endDate),
    cover_image: trip.coverImage ?? null,
    status: trip.status,
    updated_at: new Date().toISOString(),
  };
}

/** Supabase 행 → 앱 Trip */
export function supabaseRowToTrip(row: SupabaseTripRow): Trip {
  const countryCode = getCountryCodeByName(row.country);
  const currency = countryCode
    ? getCurrencyCodeByCountryCode(countryCode)
    : "KRW";

  return normalizeTrip({
    id: row.id,
    name: row.title,
    city: row.city,
    country: row.country,
    countryCode,
    flag: countryCode ? getCountryFlag(countryCode) : "🌍",
    startDate: formatDisplayDate(row.start_date),
    endDate: formatDisplayDate(row.end_date),
    duration: calculateDuration(row.start_date, row.end_date),
    status: row.status,
    statusIsManual: false,
    currency,
    exchangeRate: null,
    coverImage: row.cover_image ?? undefined,
  });
}

/**
 * 참여 여행 목록 조회
 * trip_members 에 속한 trip 만 반환한다.
 */
export async function fetchSupabaseTrips(userId: string): Promise<Trip[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data: memberRows, error: memberError } = await client
    .from("trip_members")
    .select("trip_id")
    .eq("user_id", userId);

  logSupabaseQueryResult(
    "trips.select_via_members",
    { userId, memberRows },
    memberError,
  );
  if (memberError) throw memberError;

  const tripIds = [
    ...new Set(
      (memberRows ?? [])
        .map((row) => (row as { trip_id: string }).trip_id)
        .filter(Boolean),
    ),
  ];

  if (tripIds.length === 0) {
    logSupabaseQueryResult("trips.select", { userId, data: [] });
    return [];
  }

  const { data, error } = await client
    .from("trips")
    .select("*")
    .in("id", tripIds)
    .order("created_at", { ascending: false });

  logSupabaseQueryResult("trips.select", { userId, tripIds, data }, error);
  if (error) throw error;

  return (data as SupabaseTripRow[]).map(supabaseRowToTrip);
}

/** 여행 생성 + 생성자를 owner 로 등록 */
export async function insertSupabaseTrip(
  userId: string,
  trip: Trip,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");
  const row = tripToSupabaseInsert(trip, userId);

  const { data, error } = await client.from("trips").insert(row).select();

  logSupabaseQueryResult("trips.insert", { userId, row, data }, error);
  if (error) throw error;

  await insertSupabaseTripMember(trip.id, userId, "owner");
}

/** 여행 수정 */
export async function updateSupabaseTrip(trip: Trip): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");
  const row = tripToSupabaseUpdate(trip);

  const { error } = await client
    .from("trips")
    .update(row)
    .eq("id", trip.id);

  logSupabaseQueryResult("trips.update", { tripId: trip.id, row }, error);
  if (error) throw error;
}

/** 여행 삭제 */
export async function deleteSupabaseTrip(tripId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client.from("trips").delete().eq("id", tripId);

  logSupabaseQueryResult("trips.delete", { tripId }, error);
  if (error) throw error;
}

/**
 * LocalStorage → Supabase 일괄 이전
 * legacy trip id 를 uuid 로 변환하고 생성자를 owner 로 등록한다.
 */
export async function migrateLocalTripsToSupabase(
  userId: string,
  localTrips: Trip[],
): Promise<Trip[]> {
  if (localTrips.length === 0) return [];

  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const migratedTrips = localTrips.map(assignUuidToTripForMigration);
  const rows = migratedTrips.map((trip) => tripToSupabaseInsert(trip, userId));

  const { data, error } = await client.from("trips").insert(rows).select();

  logSupabaseQueryResult("trips.migrate", { userId, rows, data }, error);
  if (error) throw error;

  await insertSupabaseTripOwners(
    userId,
    migratedTrips.map((trip) => trip.id),
  );

  return migratedTrips;
}
