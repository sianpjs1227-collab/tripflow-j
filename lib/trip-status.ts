import type { TripStatus } from "@/types/trip";

/** 상태별 표시 문구 (이모지 + 한글) */
export const tripStatusDisplay: Record<TripStatus, string> = {
  PLANNING: "🟢 계획중",
  TRAVELING: "🟡 여행중",
  COMPLETED: "⚫ 여행완료",
};

/** 상태별 이모지 */
export const tripStatusIcon: Record<TripStatus, string> = {
  PLANNING: "🟢",
  TRAVELING: "🟡",
  COMPLETED: "⚫",
};

export const tripStatusOptions: TripStatus[] = [
  "PLANNING",
  "TRAVELING",
  "COMPLETED",
];

export function isPlanningTrip(status: TripStatus): boolean {
  return status === "PLANNING";
}

export function isTravelingTrip(status: TripStatus): boolean {
  return status === "TRAVELING";
}

export function isCompletedTrip(status: TripStatus): boolean {
  return status === "COMPLETED";
}
