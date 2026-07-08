import {
  getCountryByCode,
  getCountryByName,
  getCountryFlag,
  resolveCountryCode,
  resolveCountryName,
} from "@/data/countries";
import type { Trip, TripStatus } from "@/types/trip";

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

/** 고유 ID 생성 */
export function generateTripId(): string {
  return `trip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type LegacyTrip = Trip & {
  city?: string;
  countryEmoji?: string;
};

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
    status: raw.status,
  };
}

function resolveTripFields(input: {
  name: string;
  countryCode: string;
  city: string;
  startDate: string;
  endDate: string;
}) {
  const code = input.countryCode.trim().toUpperCase();
  const country = getCountryByCode(code);
  const city = input.city.trim();
  const name = input.name.trim() || city;

  return {
    name,
    city,
    countryCode: code,
    country: country?.name ?? resolveCountryName(code),
    flag: getCountryFlag(code),
    startDate: formatDisplayDate(input.startDate),
    endDate: formatDisplayDate(input.endDate),
    duration: calculateDuration(input.startDate, input.endDate),
  };
}

/** 새 여행 객체 생성 */
export function createTrip(input: {
  name: string;
  countryCode: string;
  city: string;
  startDate: string;
  endDate: string;
  status?: TripStatus;
}): Trip {
  return {
    id: generateTripId(),
    ...resolveTripFields(input),
    status: input.status ?? "planning",
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
  },
): Trip {
  return {
    ...existing,
    ...resolveTripFields(input),
  };
}

/** 국가명으로 국가 코드 찾기 (수정 폼용) */
export function getCountryCodeByName(countryName: string): string {
  const country = getCountryByName(resolveCountryName(countryName));
  return country?.code ?? "";
}
