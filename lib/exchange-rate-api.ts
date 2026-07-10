/**
 * 브라우저용 환율 클라이언트 — /api/exchange-rate 만 호출
 * (수출입은행 API·인증키는 서버에서만 사용)
 *
 * 실패 시 null / unsupported — 여행 생성/저장을 막지 않음
 */

export interface ExchangeRateQuote {
  /** 1 외화 = N KRW */
  rate: number;
  /** 환율 기준일 (YYYY-MM-DD) */
  date: string;
  /** 조회 시각 (ISO) */
  fetchedAt: string;
  base: string;
  quote: "KRW";
  unit: number;
  provider: "koreaexim";
}

export type FetchExchangeRateResult =
  | { status: "ok"; quote: ExchangeRateQuote }
  | { status: "unsupported" }
  | { status: "error" };

export type FetchExchangeRateOptions = {
  /** ISO YYYY-MM-DD — 여행 시작일 등 */
  date?: string | null;
};

/**
 * 최신/지정일 환율 조회 (base → KRW)
 */
export async function fetchExchangeRateToKrw(
  currencyCode: string,
  options: FetchExchangeRateOptions = {},
): Promise<FetchExchangeRateResult> {
  const code = currencyCode.trim().toUpperCase();
  if (!code || code === "KRW") return { status: "error" };

  try {
    const params = new URLSearchParams({ currency: code });
    if (options.date?.trim()) {
      params.set("date", options.date.trim());
    }

    const response = await fetch(`/api/exchange-rate?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as {
      rate?: number;
      date?: string;
      fetchedAt?: string;
      base?: string;
      unit?: number;
      provider?: string;
      reason?: string;
      error?: string;
      message?: string;
    } | null;

    if (response.status === 404 && payload?.reason === "unsupported_currency") {
      return { status: "unsupported" };
    }

    if (!response.ok || typeof payload?.rate !== "number") {
      console.error("[TripFlow FX] /api/exchange-rate failed", {
        status: response.status,
        payload,
      });
      return { status: "error" };
    }

    if (!(payload.rate > 0)) return { status: "error" };

    return {
      status: "ok",
      quote: {
        rate: payload.rate,
        date: payload.date ?? new Date().toISOString().slice(0, 10),
        fetchedAt: payload.fetchedAt ?? new Date().toISOString(),
        base: (payload.base ?? code).toUpperCase(),
        quote: "KRW",
        unit:
          typeof payload.unit === "number" && payload.unit > 0
            ? payload.unit
            : 1,
        provider: "koreaexim",
      },
    };
  } catch (error) {
    console.error("[TripFlow FX] /api/exchange-rate network error", error);
    return { status: "error" };
  }
}
