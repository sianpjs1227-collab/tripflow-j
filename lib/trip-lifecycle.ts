import type { TripStatus } from "@/types/trip";
import { displayDateToIso } from "@/lib/trip-utils";

const LEGACY_STATUS_MAP: Record<string, TripStatus> = {
  planning: "PLANNING",
  preparing: "PLANNING",
  completed: "COMPLETED",
  PLANNING: "PLANNING",
  TRAVELING: "TRAVELING",
  COMPLETED: "COMPLETED",
};

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function parseDisplayDate(displayDate: string): Date | null {
  const iso = displayDateToIso(displayDate);
  if (!iso) return null;
  return new Date(`${iso}T00:00:00`);
}

/** 이전 status 값 → 새 라이프사이클 상태 */
export function migrateTripStatus(raw: string | undefined): TripStatus {
  if (!raw) return "PLANNING";
  return LEGACY_STATUS_MAP[raw] ?? "PLANNING";
}

/**
 * 여행 시작일·종료일 기준 자동 상태 계산
 * - 오늘 < 시작일 → PLANNING
 * - 시작일 ≤ 오늘 ≤ 종료일 → TRAVELING
 * - 오늘 > 종료일 → COMPLETED
 */
export function computeAutoTripStatus(
  startDate: string,
  endDate: string,
): TripStatus {
  const start = parseDisplayDate(startDate);
  const end = parseDisplayDate(endDate);
  if (!start || !end) return "PLANNING";

  const today = startOfDay(new Date());

  if (today.getTime() < start.getTime()) return "PLANNING";
  if (today.getTime() > end.getTime()) return "COMPLETED";
  return "TRAVELING";
}

/** 저장된 여행의 유효 status (수동 설정 우선) */
export function resolveTripStatus(
  startDate: string,
  endDate: string,
  storedStatus: string | undefined,
  statusIsManual?: boolean,
): TripStatus {
  if (statusIsManual) {
    return migrateTripStatus(storedStatus);
  }
  return computeAutoTripStatus(startDate, endDate);
}

/** 오늘이 여행 출발일인지 */
export function isDepartingToday(startDate: string): boolean {
  const start = parseDisplayDate(startDate);
  if (!start) return false;
  const today = startOfDay(new Date());
  return today.getTime() === start.getTime();
}
