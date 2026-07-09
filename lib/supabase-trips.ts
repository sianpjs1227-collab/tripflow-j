import { getCurrencyCodeByCountryCode, getCountryFlag } from "@/data/countries";
import { assignUuidToTripForMigration } from "@/lib/trip-migration";
import { getSupabaseClient } from "@/lib/supabase";
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

/** user_id 기준 여행 목록 조회 */
export async function fetchSupabaseTrips(userId: string): Promise<Trip[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client
    .from("trips")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data as SupabaseTripRow[]).map(supabaseRowToTrip);
}

/** 여행 생성 */
export async function insertSupabaseTrip(
  userId: string,
  trip: Trip,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client
    .from("trips")
    .insert(tripToSupabaseInsert(trip, userId));

  if (error) throw error;
}

/** 여행 수정 */
export async function updateSupabaseTrip(trip: Trip): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client
    .from("trips")
    .update(tripToSupabaseUpdate(trip))
    .eq("id", trip.id);

  if (error) throw error;
}

/** 여행 삭제 */
export async function deleteSupabaseTrip(tripId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client.from("trips").delete().eq("id", tripId);

  if (error) throw error;
}

/**
 * LocalStorage → Supabase 일괄 이전
 * legacy trip id 를 uuid 로 변환하고 상세 데이터 키도 함께 이전한다.
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

  const { error } = await client.from("trips").insert(rows);

  if (error) throw error;

  return migratedTrips;
}
