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

/** trips.insert / update 공통 — 기본 컬럼 */
type TripCoreFields = {
  title: string;
  country: string;
  city: string;
  start_date: string;
  end_date: string;
  status: Trip["status"];
  cover_image: string | null;
};

function tripToSupabaseCoreFields(trip: Trip): TripCoreFields {
  return {
    title: trip.name,
    country: trip.country,
    city: trip.city,
    start_date: displayDateToIso(trip.startDate),
    end_date: displayDateToIso(trip.endDate),
    cover_image: trip.coverImage ?? null,
    status: trip.status,
  };
}

function tripToSupabaseExchangeFields(
  trip: Trip,
): Pick<
  SupabaseTripInsert,
  | "currency"
  | "exchange_rate"
  | "exchange_rate_mode"
  | "exchange_rate_date"
  | "exchange_rate_unit"
  | "exchange_rate_provider"
  | "exchange_rate_updated_at"
> {
  const currency = trip.currency?.trim().toUpperCase() || "KRW";

  if (
    currency === "KRW" ||
    trip.exchangeRate == null ||
    trip.exchangeRate <= 0
  ) {
    return {
      currency,
      exchange_rate: null,
      exchange_rate_mode: null,
      exchange_rate_date: null,
      exchange_rate_unit: null,
      exchange_rate_provider: null,
      exchange_rate_updated_at: null,
    };
  }

  const exchangeRateDate = trip.exchangeRateDate ?? null;

  return {
    currency,
    exchange_rate: trip.exchangeRate,
    exchange_rate_mode: trip.exchangeRateMode ?? null,
    exchange_rate_date: exchangeRateDate,
    exchange_rate_unit: trip.exchangeRateUnit ?? null,
    exchange_rate_provider: trip.exchangeRateProvider ?? null,
    exchange_rate_updated_at:
      trip.exchangeRateUpdatedAt ??
      (exchangeRateDate ? `${exchangeRateDate}T00:00:00.000Z` : null),
  };
}

function tripToSupabaseMyMapsFields(
  trip: Trip,
): Pick<SupabaseTripInsert, "my_maps_map_id" | "my_maps_viewer_url"> {
  const mapId = trip.myMapsMapId?.trim() || null;
  const viewerUrl = trip.myMapsViewerUrl?.trim() || null;

  return {
    my_maps_map_id: mapId,
    my_maps_viewer_url: viewerUrl,
  };
}

function tripToSupabaseInsert(trip: Trip, userId: string): SupabaseTripInsert {
  return {
    id: trip.id,
    user_id: userId,
    ...tripToSupabaseCoreFields(trip),
    ...tripToSupabaseExchangeFields(trip),
    ...tripToSupabaseMyMapsFields(trip),
  };
}

function tripToSupabaseUpdate(trip: Trip): SupabaseTripUpdate {
  return {
    ...tripToSupabaseCoreFields(trip),
    ...tripToSupabaseExchangeFields(trip),
    ...tripToSupabaseMyMapsFields(trip),
    updated_at: new Date().toISOString(),
  };
}

function parseExchangeRateValue(
  value: number | string | null | undefined,
): number | null {
  if (value == null) return null;
  const rate = typeof value === "number" ? value : Number.parseFloat(value);
  if (Number.isNaN(rate) || rate <= 0) return null;
  return rate;
}

function logSupabaseError(
  label: string,
  error: {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  },
): void {
  console.error(label, {
    message: error.message ?? null,
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  });
}

/** Supabase 행 → 앱 Trip */
export function supabaseRowToTrip(row: SupabaseTripRow): Trip {
  const countryCode = getCountryCodeByName(row.country);
  const currencyFromCountry = countryCode
    ? getCurrencyCodeByCountryCode(countryCode)
    : "KRW";
  const currency = row.currency?.trim().toUpperCase() || currencyFromCountry;
  const exchangeRate = parseExchangeRateValue(row.exchange_rate);
  const unitRaw = row.exchange_rate_unit;
  const exchangeRateUnit =
    unitRaw == null
      ? null
      : typeof unitRaw === "number"
        ? unitRaw
        : Number.parseFloat(String(unitRaw));

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
    exchangeRate,
    exchangeRateMode:
      row.exchange_rate_mode === "startDate" ||
      row.exchange_rate_mode === "current" ||
      row.exchange_rate_mode === "manual"
        ? row.exchange_rate_mode
        : null,
    exchangeRateDate: row.exchange_rate_date ?? null,
    exchangeRateUnit:
      exchangeRateUnit != null &&
      !Number.isNaN(exchangeRateUnit) &&
      exchangeRateUnit > 0
        ? exchangeRateUnit
        : null,
    exchangeRateProvider:
      row.exchange_rate_provider === "koreaexim" ||
      row.exchange_rate_provider === "manual"
        ? row.exchange_rate_provider
        : null,
    exchangeRateUpdatedAt: row.exchange_rate_updated_at ?? null,
    coverImage: row.cover_image ?? undefined,
    myMapsMapId: row.my_maps_map_id ?? null,
    myMapsViewerUrl: row.my_maps_viewer_url ?? null,
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

/**
 * 여행 생성 + 생성자를 owner 로 등록
 *
 * 순서:
 * 1) trips.insert (returning .select() 없음 — membership 전 SELECT 403 방지)
 * 2) trip_members 에 owner 등록
 * 3) 필요 시 trips 재조회 (이제 is_trip_member 통과)
 */
export async function insertSupabaseTrip(
  userId: string,
  trip: Trip,
): Promise<Trip> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const payload = tripToSupabaseInsert(trip, userId);
  console.log("trip insert payload", payload);

  // 1) insert only — do NOT chain .select()
  const { error: insertError } = await client.from("trips").insert(payload);

  logSupabaseQueryResult("trips.insert", { userId, payload }, insertError);
  if (insertError) {
    logSupabaseError("[TripFlow Trips] trips.insert error", insertError);
    throw insertError;
  }

  // 2) register owner before any trip SELECT
  await insertSupabaseTripMember(trip.id, userId, "owner");

  // 3) fetch after membership exists
  const { data, error: selectError } = await client
    .from("trips")
    .select("*")
    .eq("id", trip.id)
    .maybeSingle();

  logSupabaseQueryResult(
    "trips.select_after_insert",
    { tripId: trip.id, data },
    selectError,
  );

  if (selectError) {
    logSupabaseError(
      "[TripFlow Trips] trips.select_after_insert error",
      selectError,
    );
    // membership 등록까지 끝났으면 로컬 trip 으로 진행 가능
    return trip;
  }

  if (data) {
    return supabaseRowToTrip(data as SupabaseTripRow);
  }

  return trip;
}

/** 여행 수정 — 환율·통화 포함 */
export async function updateSupabaseTrip(trip: Trip): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const payload = tripToSupabaseUpdate(trip);
  console.log("trip update payload", payload);

  const { error } = await client
    .from("trips")
    .update(payload)
    .eq("id", trip.id);

  logSupabaseQueryResult("trips.update", { tripId: trip.id, payload }, error);
  if (error) {
    logSupabaseError("[TripFlow Trips] trips.update error", error);
    throw error;
  }
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

  console.log("trip insert payload", rows);

  const { error } = await client.from("trips").insert(rows);

  logSupabaseQueryResult("trips.migrate", { userId, rows }, error);
  if (error) {
    logSupabaseError("[TripFlow Trips] trips.migrate error", error);
    throw error;
  }

  await insertSupabaseTripOwners(
    userId,
    migratedTrips.map((trip) => trip.id),
  );

  return migratedTrips;
}
