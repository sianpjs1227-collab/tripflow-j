import type { TripStatus } from "@/types/trip";

/**
 * 진행 상태별 표시 문구 (이모지 + 한글)
 * 카드 오른쪽에 "🟠 준비중" 형태로 보여줍니다.
 */
export const tripStatusDisplay: Record<TripStatus, string> = {
  planning: "🔵 계획중",
  preparing: "🟠 준비중",
  completed: "🟢 완료",
};
