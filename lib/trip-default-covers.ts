/** 국가별 기본 커버 이미지가 있는 ISO 코드 */
const COUNTRY_COVER_CODES = new Set(["JP", "TW", "TH", "VN", "KR"]);

/** 사용자 커버 없을 때 국가별 기본 커버 경로 */
export function getDefaultCountryCoverPath(countryCode: string): string {
  const code = countryCode.trim().toUpperCase();
  if (COUNTRY_COVER_CODES.has(code)) {
    return `/covers/${code.toLowerCase()}.svg`;
  }
  return "/covers/default.svg";
}

/** 커버 이미지 URL — 사용자 업로드 우선 */
export function resolveTripCoverSrc(
  trip: { coverImage?: string; countryCode: string },
): string {
  const userCover = trip.coverImage?.trim();
  if (userCover) return userCover;
  return getDefaultCountryCoverPath(trip.countryCode);
}
