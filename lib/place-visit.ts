import type {
  Place,
  PlaceRating,
  PlaceTravelRecordInput,
  PlaceVisit,
} from "@/types/place";

/** 장소 방문 완료 여부 */
export function isPlaceVisited(place: Place): boolean {
  return place.visit?.status === "visited";
}

/** 여행 기록 콘텐츠 존재 여부 (방문·평점·메모) */
export function hasTravelRecordContent(place: Place): boolean {
  if (!place.visit) return false;

  return (
    isPlaceVisited(place) ||
    place.visit.rating != null ||
    Boolean(place.visit.recordMemo?.trim())
  );
}

/** 방문 기록 정규화 */
export function normalizePlaceVisit(
  visit: PlaceVisit | undefined,
): PlaceVisit | undefined {
  if (!visit || visit.status !== "visited") return undefined;

  const visitedAt = visit.visitedAt?.trim();
  if (!visitedAt) return undefined;

  const rating =
    visit.rating != null &&
    visit.rating >= 1 &&
    visit.rating <= 5
      ? (Math.round(visit.rating) as PlaceRating)
      : undefined;

  const recordMemo = visit.recordMemo?.trim() || undefined;
  const photoUrls = Array.isArray(visit.photoUrls)
    ? visit.photoUrls.filter((url) => url.trim())
    : undefined;

  return {
    status: "visited",
    visitedAt,
    rating,
    recordMemo,
    photoUrls: photoUrls?.length ? photoUrls : undefined,
  };
}

/** ISO → datetime-local 입력값 */
export function isoToDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/** datetime-local → ISO */
export function datetimeLocalToIso(local: string): string {
  const date = new Date(local);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

/** 장소에서 여행 기록 폼 초기값 생성 */
export function buildTravelRecordForm(place: Place): PlaceTravelRecordInput {
  const visited = isPlaceVisited(place);
  const visitedAt = visited && place.visit?.visitedAt
    ? isoToDatetimeLocal(place.visit.visitedAt)
    : isoToDatetimeLocal(new Date().toISOString());

  return {
    visited,
    visitedAt,
    rating: place.visit?.rating ?? null,
    recordMemo: place.visit?.recordMemo ?? "",
  };
}

/** 여행 기록 저장 */
export function applyTravelRecord(
  place: Place,
  input: PlaceTravelRecordInput,
): Place {
  if (!input.visited) {
    return clearPlaceVisit(place);
  }

  const visitedAt = datetimeLocalToIso(input.visitedAt);

  return {
    ...place,
    visit: {
      status: "visited",
      visitedAt,
      rating: input.rating ?? undefined,
      recordMemo: input.recordMemo.trim() || undefined,
      photoUrls: place.visit?.photoUrls,
    },
  };
}

/** 방문 완료 처리 — 현재 시각 저장 (레거시 호환) */
export function markPlaceVisited(
  place: Place,
  visitedAt: Date = new Date(),
): Place {
  return applyTravelRecord(place, {
    visited: true,
    visitedAt: isoToDatetimeLocal(visitedAt.toISOString()),
    rating: place.visit?.rating ?? null,
    recordMemo: place.visit?.recordMemo ?? "",
  });
}

/** 방문 기록 취소 — visit 필드 제거 */
export function clearPlaceVisit(place: Place): Place {
  const { visit: _visit, ...rest } = place;
  return rest;
}

/** 방문 배지용 시각 표시 (예: 7/11 14:32) */
export function formatPlaceVisitBadge(visitedAt: string): string {
  const date = new Date(visitedAt);
  if (Number.isNaN(date.getTime())) return "";

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${month}/${day} ${hours}:${minutes}`;
}

export function getPlaceVisitBadgeLabel(place: Place): string | null {
  if (!isPlaceVisited(place) || !place.visit?.visitedAt) return null;
  return formatPlaceVisitBadge(place.visit.visitedAt);
}

/** 평점 별 표시 (예: ★★★★☆) */
export function formatPlaceRatingStars(rating: PlaceRating): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

/** 카드용 기록 메모 축약 */
export function truncateRecordMemo(memo: string, maxLength = 28): string {
  const trimmed = memo.trim();
  if (!trimmed) return "";
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
}

/** 여행 리포트 집계용 */
export interface TripTravelRecordStats {
  visitedCount: number;
  ratedCount: number;
  recordCount: number;
  averageRating: number | null;
}

export function getTripTravelRecordStats(places: Place[]): TripTravelRecordStats {
  const visitedPlaces = places.filter(isPlaceVisited);
  const ratedPlaces = visitedPlaces.filter(
    (place) => place.visit?.rating != null,
  );
  const recordCount = places.filter(hasTravelRecordContent).length;

  const averageRating =
    ratedPlaces.length > 0
      ? ratedPlaces.reduce(
          (sum, place) => sum + (place.visit!.rating as number),
          0,
        ) / ratedPlaces.length
      : null;

  return {
    visitedCount: visitedPlaces.length,
    ratedCount: ratedPlaces.length,
    recordCount,
    averageRating,
  };
}
