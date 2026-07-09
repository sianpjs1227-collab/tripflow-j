/** 국가별 대표 도시 목록 (countryCode → 도시명[]) */
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  KR: [
    "서울",
    "부산",
    "제주",
    "인천",
    "대구",
    "광주",
    "대전",
    "강릉",
    "경주",
    "여수",
  ],
  JP: [
    "후쿠오카",
    "도쿄",
    "오사카",
    "교토",
    "삿포로",
    "나고야",
    "요코하마",
    "고베",
    "히로시마",
    "나하(오키나와)",
    "나라",
    "가고시마",
  ],
  TH: [
    "방콕",
    "치앙마이",
    "푸켓",
    "파타야",
    "크라비",
    "후아힌",
    "코사무이",
    "아유타야",
  ],
  VN: [
    "하노이",
    "호치민",
    "다낭",
    "나트랑",
    "호이안",
    "푸꾸옥",
    "달랏",
    "하롱베이",
  ],
  TW: [
    "타이베이",
    "타이중",
    "타이난",
    "가오슝",
    "화련",
    "지룽",
    "신베이",
    "펑후",
  ],
  HK: ["홍콩", "카오룽", "홍콩섬", "란타우"],
  SG: ["싱가포르"],
  US: [
    "뉴욕",
    "로스앤젤레스",
    "샌프란시스코",
    "라스베이거스",
    "시애틀",
    "하와이",
    "시카고",
    "보스턴",
    "마이애미",
    "워싱턴 D.C.",
  ],
  FR: [
    "파리",
    "니스",
    "리옹",
    "마르세유",
    "보르도",
    "스트라스부르",
    "아비뇽",
    "몽펠리에",
  ],
  IT: [
    "로마",
    "밀라노",
    "베니스",
    "피렌체",
    "나폴리",
    "토리노",
    "볼로냐",
    "베로나",
    "시칠리아",
  ],
  GB: [
    "런던",
    "에든버러",
    "맨체스터",
    "리버풀",
    "옥스퍼드",
    "케임브리지",
    "글래스고",
    "베스터",
  ],
};

/** 국가 코드에 해당하는 대표 도시 목록 */
export function getCitiesByCountryCode(countryCode: string): string[] {
  const code = countryCode.trim().toUpperCase();
  return CITIES_BY_COUNTRY[code] ?? [];
}

/** 도시명 실시간 필터 (대소문자 무시, 부분 일치) */
export function filterCities(cities: string[], query: string): string[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return cities;
  return cities.filter((city) => city.toLowerCase().includes(trimmed));
}

/** 목록에 정확히 일치하는 도시가 있는지 */
export function cityExistsInList(cities: string[], name: string): boolean {
  const trimmed = name.trim().toLowerCase();
  return cities.some((city) => city.toLowerCase() === trimmed);
}
