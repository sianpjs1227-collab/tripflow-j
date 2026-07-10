/**
 * 한국수출입은행(Open API) 환율 — 서버(Route Handler) 전용
 *
 * Endpoint:
 *   https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON
 *
 * Env:
 *   KOREAEXIM_API_KEY — 인증키 (authkey)
 *
 * 통화 단위:
 *   CUR_UNIT 예: "USD", "EUR", "JPY(100)", "IDR(100)"
 *   DEAL_BAS_R 는 해당 단위 기준 원화 매매기준율
 *   → 앱 저장값(exchangeRate)은 항상 "외화 1단위당 KRW" 로 정규화
 *     ratePerOne = DEAL_BAS_R / unit
 *
 * AP01 미제공 통화(VND, TWD 등):
 *   reason: "unsupported_currency"
 */

export type ExchangeRateQuote = {
  /** 외화 1단위 = N KRW */
  rate: number;
  /** 조회에 사용한 기준일 (YYYY-MM-DD) */
  date: string;
  /** 조회 시각 (ISO) */
  fetchedAt: string;
  provider: "koreaexim";
  /** API CUR_UNIT 원문 (예: JPY(100)) */
  curUnit: string;
  /** CUR_UNIT 에서 파싱한 단위 (1 또는 100 등) */
  unit: number;
  /** 매매기준율 원문 (단위 기준) */
  dealBasR: number;
};

export type ExchangeRateFetchResult =
  | { ok: true; quote: ExchangeRateQuote }
  | {
      ok: false;
      reason: "missing_key" | "unsupported_currency" | "unavailable" | "invalid";
    };

const EXIM_BASE_URL =
  "https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON";

/** 비영업일·오전 미고시 대비 과거 영업일 재시도 횟수 */
const MAX_DATE_LOOKBACK = 14;

type EximRow = {
  result?: number;
  cur_unit?: string;
  cur_nm?: string;
  deal_bas_r?: string;
  ttb?: string;
  tts?: string;
};

/** API는 대문자 키(CUR_UNIT 등)로 응답 — 소문자로 정규화 */
function normalizeEximRow(raw: Record<string, unknown>): EximRow {
  const lower: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    lower[key.toLowerCase()] = value;
  }
  return {
    result:
      typeof lower.result === "number"
        ? lower.result
        : lower.result != null
          ? Number(lower.result)
          : undefined,
    cur_unit:
      typeof lower.cur_unit === "string" ? lower.cur_unit : undefined,
    cur_nm: typeof lower.cur_nm === "string" ? lower.cur_nm : undefined,
    deal_bas_r:
      typeof lower.deal_bas_r === "string"
        ? lower.deal_bas_r
        : lower.deal_bas_r != null
          ? String(lower.deal_bas_r)
          : undefined,
    ttb: typeof lower.ttb === "string" ? lower.ttb : undefined,
    tts: typeof lower.tts === "string" ? lower.tts : undefined,
  };
}

/**
 * CUR_UNIT → { code, unit }
 * "JPY(100)" → { code: "JPY", unit: 100 }
 * "USD"      → { code: "USD", unit: 1 }
 */
export function parseEximCurUnit(curUnit: string): {
  code: string;
  unit: number;
} {
  const raw = curUnit.trim().toUpperCase();
  const match = /^([A-Z]{3})\((\d+)\)$/.exec(raw);
  if (match) {
    return {
      code: match[1],
      unit: Number.parseInt(match[2], 10) || 1,
    };
  }
  const codeMatch = /^([A-Z]{3})/.exec(raw);
  return {
    code: codeMatch?.[1] ?? raw,
    unit: 1,
  };
}

/** "1,356.5" → 1356.5 */
function parseEximNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const n = Number.parseFloat(value.replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function toYyyymmddSeoul(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}${m}${d}`;
}

/** ISO YYYY-MM-DD → YYYYMMDD (유효하지 않으면 null) */
export function isoDateToYyyymmdd(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  return `${m[1]}${m[2]}${m[3]}`;
}

function shiftYyyymmdd(yyyymmdd: string, deltaDays: number): string {
  const y = Number.parseInt(yyyymmdd.slice(0, 4), 10);
  const m = Number.parseInt(yyyymmdd.slice(4, 6), 10);
  const d = Number.parseInt(yyyymmdd.slice(6, 8), 10);
  const utc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  utc.setUTCDate(utc.getUTCDate() + deltaDays);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

function yyyymmddToIso(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function getAuthKey(): string | null {
  const key = process.env.KOREAEXIM_API_KEY?.trim();
  return key || null;
}

function buildUrl(authkey: string, searchdate: string): string {
  const params = new URLSearchParams({
    authkey,
    searchdate,
    data: "AP01",
  });
  return `${EXIM_BASE_URL}?${params.toString()}`;
}

function logAttempt(
  urlForLog: string,
  status: number | null,
  bodyPreview: string | null,
  error: unknown | null,
): void {
  const safeUrl = urlForLog.replace(/authkey=[^&]+/i, "authkey=***");
  console.error("[exchange-rate] koreaexim");
  console.error(`  1. URL: ${safeUrl}`);
  console.error(`  2. response.status: ${status ?? "(no response)"}`);
  console.error(
    `  3. response.text(): ${bodyPreview != null ? bodyPreview.slice(0, 500) : "(n/a)"}`,
  );
  if (error != null) {
    console.error(
      `  4. catch(error):`,
      error instanceof Error ? error.message : error,
    );
  } else {
    console.error(`  4. catch(error): (none)`);
  }
}

async function fetchEximDay(
  authkey: string,
  searchdate: string,
): Promise<EximRow[] | null> {
  const url = buildUrl(authkey, searchdate);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const text = await response.text();
    logAttempt(url, response.status, text, null);

    if (!response.ok) return null;

    let data: unknown;
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      console.error("[exchange-rate] koreaexim: invalid JSON");
      return null;
    }

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const result = (data as { result?: number }).result;
      if (result === 2) {
        console.error("[exchange-rate] koreaexim: DATA 코드 오류 (result=2)");
      } else if (result === 3) {
        console.error("[exchange-rate] koreaexim: 인증키 오류 (result=3)");
      } else if (result === 4) {
        console.error("[exchange-rate] koreaexim: 일일 호출 한도 (result=4)");
      }
      return null;
    }

    if (!Array.isArray(data)) return null;
    if (data.length === 0) return [];

    return data
      .filter((item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
      .map(normalizeEximRow);
  } catch (error) {
    logAttempt(url, null, null, error);
    return null;
  }
}

function findCurrencyRow(
  rows: EximRow[],
  currencyCode: string,
): EximRow | null {
  const code = currencyCode.toUpperCase();
  for (const row of rows) {
    if (!row.cur_unit) continue;
    const parsed = parseEximCurUnit(row.cur_unit);
    if (parsed.code === code) return row;
  }
  return null;
}

function rowToQuote(
  row: EximRow,
  searchdate: string,
): ExchangeRateQuote | null {
  if (!row.cur_unit) return null;
  const { code, unit } = parseEximCurUnit(row.cur_unit);
  if (!code || unit <= 0) return null;

  const dealBasR = parseEximNumber(row.deal_bas_r);
  if (dealBasR == null) return null;

  const rate = dealBasR / unit;
  if (!Number.isFinite(rate) || rate <= 0) return null;

  return {
    rate,
    date: yyyymmddToIso(searchdate),
    fetchedAt: new Date().toISOString(),
    provider: "koreaexim",
    curUnit: row.cur_unit,
    unit,
    dealBasR,
  };
}

export type FetchExchangeRateOptions = {
  /** ISO YYYY-MM-DD — 미지정 시 오늘(KST) */
  searchDate?: string | null;
};

/**
 * baseCurrency 1단위 → KRW 환율 (수출입은행 매매기준율)
 * searchDate 기준일부터 과거로 lookback (비영업일 대비)
 */
export async function fetchExchangeRateToKrwServer(
  baseCurrency: string,
  options: FetchExchangeRateOptions = {},
): Promise<ExchangeRateFetchResult> {
  const code = baseCurrency.trim().toUpperCase();
  if (!code || code === "KRW") {
    return { ok: false, reason: "invalid" };
  }

  const authkey = getAuthKey();
  if (!authkey) {
    console.error(
      "[exchange-rate] KOREAEXIM_API_KEY 환경변수가 없습니다. .env.local 에 설정하세요.",
    );
    return { ok: false, reason: "missing_key" };
  }

  let searchdate =
    (options.searchDate ? isoDateToYyyymmdd(options.searchDate) : null) ??
    toYyyymmddSeoul();

  let sawNonEmptyList = false;

  for (let i = 0; i < MAX_DATE_LOOKBACK; i += 1) {
    const rows = await fetchEximDay(authkey, searchdate);

    if (rows == null) {
      return { ok: false, reason: "unavailable" };
    }

    if (rows.length === 0) {
      console.info(
        `[exchange-rate] koreaexim: empty for ${searchdate} (비영업일/미고시) → 이전일 시도`,
      );
      searchdate = shiftYyyymmdd(searchdate, -1);
      continue;
    }

    sawNonEmptyList = true;

    const firstResult = rows[0]?.result;
    if (firstResult != null && firstResult !== 1) {
      console.error(`[exchange-rate] koreaexim: result=${firstResult}`);
      return { ok: false, reason: "unavailable" };
    }

    const row = findCurrencyRow(rows, code);
    if (!row) {
      // 고시 목록에 통화 자체가 없음 (VND/TWD 등)
      console.info(
        `[exchange-rate] koreaexim: currency ${code} not in AP01 list`,
      );
      return { ok: false, reason: "unsupported_currency" };
    }

    const quote = rowToQuote(row, searchdate);
    if (!quote) {
      console.error("[exchange-rate] koreaexim: failed to parse DEAL_BAS_R");
      return { ok: false, reason: "unavailable" };
    }

    console.info(
      `[exchange-rate] OK provider=koreaexim ${code} cur_unit=${quote.curUnit} deal_bas_r=${quote.dealBasR} unit=${quote.unit} ratePerOne=${quote.rate} date=${quote.date}`,
    );
    return { ok: true, quote };
  }

  console.error("[exchange-rate] koreaexim: no data within lookback window");
  return {
    ok: false,
    reason: sawNonEmptyList ? "unsupported_currency" : "unavailable",
  };
}
