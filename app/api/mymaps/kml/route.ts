import { NextRequest, NextResponse } from "next/server";

const LOG_PREFIX = "[TripFlow MyMaps Sync API]";

type BodyKind = "json" | "html" | "kml" | "kmz" | "unknown";

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

function headersToObject(headers: Headers): Record<string, string> {
  return Object.fromEntries(headers.entries());
}

/** 응답 본문 종류 판별 */
function detectBodyKind(
  buffer: ArrayBuffer,
  contentType: string | null,
): BodyKind {
  const data = new Uint8Array(buffer);

  if (data.length >= 2 && data[0] === 0x50 && data[1] === 0x4b) {
    return "kmz";
  }

  const preview = new TextDecoder("utf-8", { fatal: false })
    .decode(data.slice(0, 800))
    .trimStart()
    .toLowerCase();

  if (preview.startsWith("{") || preview.startsWith("[")) return "json";
  if (preview.startsWith("<!doctype html") || preview.startsWith("<html")) {
    return "html";
  }
  if (preview.startsWith("<?xml") || preview.startsWith("<kml")) return "kml";

  const ct = (contentType ?? "").toLowerCase();
  if (ct.includes("json")) return "json";
  if (ct.includes("html")) return "html";
  if (ct.includes("kml")) return "kml";
  if (
    ct.includes("kmz") ||
    ct.includes("zip") ||
    ct.includes("octet-stream")
  ) {
    return "kmz";
  }

  return "unknown";
}

function getBodyTextPreview(buffer: ArrayBuffer, maxLength = 3000): string {
  return new TextDecoder("utf-8", { fatal: false })
    .decode(buffer)
    .slice(0, maxLength);
}

function serverErrorResponse(error: unknown): NextResponse {
  const cause =
    error instanceof Error && error.cause !== undefined
      ? error.cause instanceof Error
        ? error.cause.message
        : String(error.cause)
      : undefined;

  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : String(error),
      stack:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.stack
            : undefined
          : undefined,
      cause:
        process.env.NODE_ENV === "development" ? cause : undefined,
    },
    { status: 500 },
  );
}

/** Google My Maps KML/KMZ 프록시 — 브라우저 CORS 우회 */
export async function GET(request: NextRequest) {
  const mid = request.nextUrl.searchParams.get("mid")?.trim();

  if (!mid) {
    console.error(LOG_PREFIX, "map id(mid) 누락");
    return NextResponse.json({ error: "map id(mid)가 필요합니다." }, { status: 400 });
  }

  const kmlUrl = `https://www.google.com/maps/d/kml?mid=${encodeURIComponent(mid)}`;
  console.log(LOG_PREFIX, "Google fetch 시작", { mid, kmlUrl, isDev: isDev() });

  try {
    const response = await fetch(kmlUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
      cache: "no-store",
      redirect: "follow",
    });
    console.log(LOG_PREFIX, "여기까지 통과: fetch()");

    console.log(LOG_PREFIX, "Google response.status", response.status);
    console.log(LOG_PREFIX, "Google response.headers", headersToObject(response.headers));
    console.log(LOG_PREFIX, "Google response.url", response.url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(LOG_PREFIX, "Google fetch 실패 — response.ok false");
      console.error(LOG_PREFIX, "Google response body (text)", errorText);

      return NextResponse.json(
        {
          error: `Google My Maps 응답 오류 (HTTP ${response.status})`,
          ...(isDev()
            ? {
                googleStatus: response.status,
                googleBody: errorText,
              }
            : {}),
        },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    const buffer = await response.arrayBuffer();
    console.log(LOG_PREFIX, "여기까지 통과: response.arrayBuffer()");

    const bodyKind = detectBodyKind(buffer, contentType);

    console.log(LOG_PREFIX, "Google 응답 본문 종류", {
      bodyKind,
      contentType: contentType ?? "(없음)",
      bytes: buffer.byteLength,
    });

    if (buffer.byteLength === 0) {
      console.error(LOG_PREFIX, "Google My Maps에서 빈 파일 반환", {
        status: response.status,
        bodyKind,
      });
      return NextResponse.json(
        { error: "Google My Maps에서 빈 파일을 반환했습니다." },
        { status: 502 },
      );
    }

    if (bodyKind === "html") {
      const bodyPreview = getBodyTextPreview(buffer);
      console.error(LOG_PREFIX, "Google이 HTML 반환", bodyPreview);
      return NextResponse.json(
        {
          error:
            "Google이 HTML 페이지를 반환했습니다. 지도가 공개되어 있는지, mid가 올바른지 확인하세요.",
          ...(isDev() ? { googleBody: bodyPreview } : {}),
        },
        { status: 502 },
      );
    }

    if (bodyKind === "json") {
      const bodyPreview = getBodyTextPreview(buffer);
      console.error(LOG_PREFIX, "Google이 JSON 오류 반환", bodyPreview);
      return NextResponse.json(
        {
          error: "Google이 JSON 오류 응답을 반환했습니다.",
          ...(isDev() ? { googleBody: bodyPreview } : {}),
        },
        { status: 502 },
      );
    }

    if (bodyKind === "kmz") {
      console.log(LOG_PREFIX, "KMZ 다운로드 성공", {
        contentType: contentType ?? "(없음)",
        contentLength: contentLength ?? String(buffer.byteLength),
        bytes: buffer.byteLength,
      });
    } else {
      console.log(LOG_PREFIX, "Google fetch 성공", {
        bodyKind,
        contentType: contentType ?? "(없음)",
        bytes: buffer.byteLength,
      });
    }

    console.log(LOG_PREFIX, "여기까지 통과: return new NextResponse()");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType ?? "application/octet-stream",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("====================");
    console.error(error);
    if (error instanceof Error) {
      console.error(error.cause);
      console.error(error.stack);
    }
    console.error("====================");

    return serverErrorResponse(error);
  }
}
