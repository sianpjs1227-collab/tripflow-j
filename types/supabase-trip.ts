import type { TripStatus, ExchangeRateMode, ExchangeRateProvider } from "@/types/trip";

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
  /** migration 미적용 시 undefined */
  currency?: string | null;
  exchange_rate?: number | string | null;
  exchange_rate_updated_at?: string | null;
  exchange_rate_mode?: string | null;
  exchange_rate_date?: string | null;
  exchange_rate_unit?: number | string | null;
  exchange_rate_provider?: string | null;
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
  currency?: string | null;
  exchange_rate?: number | null;
  exchange_rate_updated_at?: string | null;
  exchange_rate_mode?: ExchangeRateMode | null;
  exchange_rate_date?: string | null;
  exchange_rate_unit?: number | null;
  exchange_rate_provider?: ExchangeRateProvider | null;
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
  currency?: string | null;
  exchange_rate?: number | null;
  exchange_rate_updated_at?: string | null;
  exchange_rate_mode?: ExchangeRateMode | null;
  exchange_rate_date?: string | null;
  exchange_rate_unit?: number | null;
  exchange_rate_provider?: ExchangeRateProvider | null;
}
