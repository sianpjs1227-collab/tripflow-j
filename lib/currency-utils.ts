import type { Trip } from "@/types/trip";

/** KRW 기준 통화 여부 */
export function isKrwCurrency(currencyCode: string): boolean {
  return currencyCode.trim().toUpperCase() === "KRW";
}

/** 환율이 설정된 여행인지 (외화 + 환율) */
export function tripHasExchangeRate(
  trip: Pick<Trip, "exchangeRate">,
): boolean {
  return trip.exchangeRate != null && trip.exchangeRate > 0;
}

/** 현지 통화 금액 표시 (예: 1,280 JPY) */
export function formatLocalCurrencyAmount(
  amount: number,
  currencyCode: string,
): string {
  const code = currencyCode.trim().toUpperCase();
  const formatted = amount.toLocaleString("ko-KR", {
    maximumFractionDigits: code === "KRW" ? 0 : 2,
  });
  return `${formatted} ${code}`;
}

/** 원화 금액 표시 (예: 11,917 KRW) */
export function formatKrwAmount(amount: number): string {
  return `${Math.round(amount).toLocaleString("ko-KR")} KRW`;
}

/** 현지 금액 → 원화 변환 */
export function convertToKrw(
  localAmount: number,
  exchangeRate: number,
): number {
  return Math.round(localAmount * exchangeRate);
}

/** 환율 라벨 (예: 1 JPY = 9.31 KRW) */
export function formatExchangeRateLabel(
  currencyCode: string,
  exchangeRate: number,
): string {
  const code = currencyCode.trim().toUpperCase();
  const formatted = exchangeRate.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
  return `1 ${code} = ${formatted} KRW`;
}

/** 환율 입력 문자열 파싱 */
export function parseExchangeRateInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const rate = Number.parseFloat(trimmed);
  if (Number.isNaN(rate) || rate <= 0) return null;

  return rate;
}
