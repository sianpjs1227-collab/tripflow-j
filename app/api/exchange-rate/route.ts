import { NextResponse } from "next/server";
import { fetchExchangeRateToKrwServer } from "@/lib/exchange-rate-server";

/**
 * GET /api/exchange-rate?currency=JPY&date=2026-08-11
 *
 * date(optional): ISO YYYY-MM-DD — 여행 시작일 환율 등
 * 미지정 시 오늘(KST) 기준
 *
 * 성공: { rate, date, fetchedAt, provider, base, quote, unit, curUnit, dealBasR }
 * 미지원 통화: 404 + reason: unsupported_currency
 * 그 외 실패: 502 (여행 생성과 무관)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currency = searchParams.get("currency")?.trim().toUpperCase() ?? "";
  const dateParam = searchParams.get("date")?.trim() || null;

  if (!currency) {
    return NextResponse.json(
      {
        error: "currency query is required",
        message: "환율을 가져올 수 없습니다.",
      },
      { status: 400 },
    );
  }

  if (currency === "KRW") {
    return NextResponse.json(
      {
        error: "KRW does not need FX",
        message: "환율을 가져올 수 없습니다.",
      },
      { status: 400 },
    );
  }

  if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json(
      {
        error: "invalid date",
        message: "환율을 가져올 수 없습니다.",
      },
      { status: 400 },
    );
  }

  if (!process.env.KOREAEXIM_API_KEY?.trim()) {
    console.error("[api/exchange-rate] KOREAEXIM_API_KEY missing");
    return NextResponse.json(
      {
        error: "api key not configured",
        message: "환율을 가져올 수 없습니다.",
      },
      { status: 502 },
    );
  }

  try {
    const result = await fetchExchangeRateToKrwServer(currency, {
      searchDate: dateParam,
    });

    if (!result.ok) {
      if (result.reason === "unsupported_currency") {
        return NextResponse.json(
          {
            error: "unsupported_currency",
            reason: "unsupported_currency",
            message: "직접 입력으로 전환하시겠습니까?",
            base: currency,
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          error: "exchange rate unavailable",
          reason: result.reason,
          message: "환율을 가져올 수 없습니다.",
        },
        { status: 502 },
      );
    }

    const { quote } = result;
    return NextResponse.json({
      rate: quote.rate,
      date: quote.date,
      fetchedAt: quote.fetchedAt,
      provider: quote.provider,
      base: currency,
      quote: "KRW",
      unit: quote.unit,
      curUnit: quote.curUnit,
      dealBasR: quote.dealBasR,
    });
  } catch (error) {
    console.error("[api/exchange-rate] unexpected error:", error);
    return NextResponse.json(
      {
        error: "exchange rate failed",
        message: "환율을 가져올 수 없습니다.",
      },
      { status: 502 },
    );
  }
}
