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

/**
 * 통화별 표시 단위 (수출입은행·수동 입력 공통)
 * JPY / VND / IDR → 100, 그 외 → 1
 */
export function getExchangeRateDisplayUnit(currencyCode: string): number {
  const code = currencyCode.trim().toUpperCase();
  if (code === "JPY" || code === "VND" || code === "IDR") return 100;
  return 1;
}

/** 수동 입력 라벨용 통화 이름 */
export function getCurrencyUnitLabel(currencyCode: string): string {
  switch (currencyCode.trim().toUpperCase()) {
    case "JPY":
      return "엔";
    case "USD":
      return "달러";
    case "EUR":
      return "유로";
    case "GBP":
      return "파운드";
    case "THB":
      return "바트";
    case "VND":
      return "동";
    case "TWD":
      return "대만달러";
    case "HKD":
      return "홍콩달러";
    case "SGD":
      return "싱가포르달러";
    case "IDR":
      return "루피아";
    default:
      return currencyCode.trim().toUpperCase();
  }
}

/**
 * 표시 단위 금액 → 1단위당 KRW
 * 예: 100JPY = 945.30 → ratePerOne = 9.453
 */
export function displayAmountToRatePerOne(
  displayAmount: number,
  unit: number,
): number {
  if (!(displayAmount > 0) || !(unit > 0)) return NaN;
  return displayAmount / unit;
}

/** 1단위당 KRW → 표시 단위 금액 */
export function ratePerOneToDisplayAmount(
  ratePerOne: number,
  unit: number,
): number {
  return ratePerOne * unit;
}

/** 통화 기호 */
export function getCurrencySymbol(currencyCode: string): string {
  switch (currencyCode.trim().toUpperCase()) {
    case "KRW":
      return "₩";
    case "JPY":
      return "¥";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "THB":
      return "฿";
    case "VND":
      return "₫";
    case "TWD":
      return "NT$";
    case "HKD":
      return "HK$";
    case "SGD":
      return "S$";
    default:
      return "";
  }
}

/** 현지 통화 금액 표시 (예: ¥1,200 / 1,280 JPY) */
export function formatLocalCurrencyAmount(
  amount: number,
  currencyCode: string,
): string {
  const code = currencyCode.trim().toUpperCase();
  const symbol = getCurrencySymbol(code);
  const formatted = amount.toLocaleString("ko-KR", {
    maximumFractionDigits: code === "JPY" || code === "KRW" || code === "VND" ? 0 : 2,
  });
  if (symbol) return `${symbol}${formatted}`;
  return `${formatted} ${code}`;
}

/** 원화 금액 표시 (예: ₩11,364) */
export function formatKrwAmount(amount: number): string {
  return `₩${Math.round(amount).toLocaleString("ko-KR")}`;
}

/** 현지 금액 → 원화 변환 (exchangeRate = 1단위당 KRW) */
export function convertToKrw(
  localAmount: number,
  exchangeRate: number,
): number {
  return Math.round(localAmount * exchangeRate);
}

/**
 * 적용 환율 라벨
 * unit 미지정 시 통화 기본 표시 단위 사용
 * 소수 있으면 최대 2자리까지 표시
 */
export function formatExchangeRateLabel(
  currencyCode: string,
  exchangeRate: number,
  unitOverride?: number | null,
): string {
  const code = currencyCode.trim().toUpperCase();
  const units =
    unitOverride != null && unitOverride > 0
      ? unitOverride
      : getExchangeRateDisplayUnit(code);
  const krw = ratePerOneToDisplayAmount(exchangeRate, units);
  const krwText = Number.isInteger(krw)
    ? krw.toLocaleString("ko-KR")
    : krw.toLocaleString("ko-KR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
  return `${units}${code} = ${krwText}원`;
}

/** 환율 기준일 표시 (예: 2026-07-11) */
export function formatExchangeRateDateLabel(
  dateOrIso: string | null | undefined,
): string | null {
  if (!dateOrIso?.trim()) return null;
  const isoDay = dateOrIso.includes("T")
    ? dateOrIso.slice(0, 10)
    : dateOrIso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) return null;
  return isoDay;
}

/** 환율 모드 표시 문구 */
export function formatExchangeRateModeLabel(
  mode: Trip["exchangeRateMode"] | null | undefined,
): string {
  switch (mode) {
    case "startDate":
      return "여행 시작일";
    case "current":
      return "현재 환율";
    case "manual":
      return "직접 입력";
    default:
      return "";
  }
}

/** 환율 입력 문자열 파싱 */
export function parseExchangeRateInput(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, "");
  if (!trimmed) return null;

  const rate = Number.parseFloat(trimmed);
  if (Number.isNaN(rate) || rate <= 0) return null;

  return rate;
}
