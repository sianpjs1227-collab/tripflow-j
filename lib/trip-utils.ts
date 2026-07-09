import {
  getCountryByCode,
  getCountryByName,
  getCurrencyCodeByCountryCode,
  getCountryFlag,
  resolveCountryCode,
  resolveCountryName,
} from "@/data/countries";
import type { Trip } from "@/types/trip";
import { parseExchangeRateInput } from "@/lib/currency-utils";
import {
  computeAutoTripStatus,
  resolveTripStatus,
} from "@/lib/trip-lifecycle";

/** ISO 날짜(YYYY-MM-DD)를 화면 표시용(YYYY.MM.DD)으로 변환 */
export function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${year}.${month}.${day}`;
}

/** 두 날짜 사이 숙박 일수 계산 (예: "3박4일") */
export function calculateDuration(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const diffMs = end.getTime() - start.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
  const nights = days - 1;
  return `${nights}박${days}일`;
}

/** 고유 ID 생성 (LocalStorage 모드) */
export function generateTripId(): string {
  return `trip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** UUID 생성 (Supabase 모드) */
export function generateTripUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return generateTripId();
}

type LegacyTrip = Trip & {
  city?: string;
  countryEmoji?: string;
  baseCurrency?: string;
  exchangeRateToKrw?: number;
  statusIsManual?: boolean;
  coverImage?: string;
};

function resolveTripCurrencyFields(
  countryCode: string,
  rawCurrency?: string,
  rawRate?: number | null,
): { currency: string; exchangeRate: number | null } {
  const currency =
    rawCurrency?.trim().toUpperCase() ||
    getCurrencyCodeByCountryCode(countryCode);

  if (currency === "KRW") {
    return { currency: "KRW", exchangeRate: null };
  }

  const rate =
    rawRate != null && !Number.isNaN(rawRate) && rawRate > 0 ? rawRate : null;

  return { currency, exchangeRate: rate };
}

/** localStorage 에서 불러온 여행 데이터 정규화 */
export function normalizeTrip(raw: LegacyTrip): Trip {
  const legacyFlagOrCode = raw.flag ?? raw.countryEmoji ?? "";
  const countryCode = resolveCountryCode(
    raw.country,
    raw.countryCode,
    legacyFlagOrCode,
  );
  const country = resolveCountryName(raw.country);
  const flag = countryCode ? getCountryFlag(countryCode) : "🌍";
  const city = raw.city?.trim() || raw.name?.trim() || "";
  const name = raw.name?.trim() || city;

  const legacyCurrency = raw.currency ?? raw.baseCurrency;
  const legacyRate = raw.exchangeRate ?? raw.exchangeRateToKrw ?? null;
  const { currency, exchangeRate } = resolveTripCurrencyFields(
    countryCode,
    legacyCurrency,
    legacyRate,
  );
  const statusIsManual = raw.statusIsManual ?? false;
  const status = resolveTripStatus(
    raw.startDate,
    raw.endDate,
    raw.status,
    statusIsManual,
  );

  return {
    id: raw.id,
    name,
    city,
    country,
    countryCode,
    flag,
    startDate: raw.startDate,
    endDate: raw.endDate,
    duration: raw.duration,
    status,
    statusIsManual,
    currency,
    exchangeRate,
    coverImage: raw.coverImage || undefined,
  };
}

function resolveTripFields(input: {
  name: string;
  countryCode: string;
  city: string;
  startDate: string;
  endDate: string;
  exchangeRate: string;
  coverImage?: string;
}) {
  const code = input.countryCode.trim().toUpperCase();
  const country = getCountryByCode(code);
  const city = input.city.trim();
  const name = input.name.trim() || city;
  const currency = getCurrencyCodeByCountryCode(code);
  const parsedRate = parseExchangeRateInput(input.exchangeRate);
  const exchangeRate =
    currency === "KRW" ? null : (parsedRate ?? null);

  return {
    name,
    city,
    countryCode: code,
    country: country?.name ?? resolveCountryName(code),
    flag: getCountryFlag(code),
    startDate: formatDisplayDate(input.startDate),
    endDate: formatDisplayDate(input.endDate),
    duration: calculateDuration(input.startDate, input.endDate),
    currency,
    exchangeRate,
    coverImage: input.coverImage?.trim() || undefined,
  };
}

/** 새 여행 객체 생성 */
export function createTrip(
  input: {
    name: string;
    countryCode: string;
    city: string;
    startDate: string;
    endDate: string;
    exchangeRate: string;
    coverImage?: string;
  },
  options?: { id?: string; useUuid?: boolean },
): Trip {
  const fields = resolveTripFields(input);
  const status = computeAutoTripStatus(fields.startDate, fields.endDate);
  const id =
    options?.id ??
    (options?.useUuid ? generateTripUuid() : generateTripId());

  return {
    id,
    ...fields,
    status,
    statusIsManual: false,
  };
}

/** 표시용 날짜(YYYY.MM.DD) → 입력용(YYYY-MM-DD) */
export function displayDateToIso(displayDate: string): string {
  const parts = displayDate.split(".").map((p) => p.trim());
  if (parts.length !== 3) return "";
  const [year, month, day] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/** 기존 여행 수정 */
export function updateTrip(
  existing: Trip,
  input: {
    name: string;
    countryCode: string;
    city: string;
    startDate: string;
    endDate: string;
    exchangeRate: string;
    coverImage?: string;
  },
): Trip {
  const fields = resolveTripFields(input);
  const parsedRate = parseExchangeRateInput(input.exchangeRate);

  let exchangeRate = fields.exchangeRate;
  if (fields.currency === "KRW") {
    exchangeRate = null;
  } else if (parsedRate != null) {
    exchangeRate = parsedRate;
  } else if (fields.countryCode === existing.countryCode) {
    exchangeRate = existing.exchangeRate;
  }

  const statusIsManual = existing.statusIsManual ?? false;
  const status = statusIsManual
    ? existing.status
    : computeAutoTripStatus(fields.startDate, fields.endDate);

  return {
    ...existing,
    ...fields,
    exchangeRate,
    status,
    statusIsManual,
    coverImage:
      input.coverImage !== undefined
        ? input.coverImage.trim() || undefined
        : existing.coverImage,
  };
}

/** 국가명으로 국가 코드 찾기 (수정 폼용) */
export function getCountryCodeByName(countryName: string): string {
  const country = getCountryByName(resolveCountryName(countryName));
  return country?.code ?? "";
}
