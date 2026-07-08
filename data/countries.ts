/** 선택 가능한 국가 (배열로 관리 — 항목 추가 시 여기만 수정) */
export interface Country {
  name: string;
  code: string;
  flag: string;
}

/** ISO 3166-1 alpha-2 코드 → Unicode 국기 이모지 */
export function countryCodeToFlag(code: string): string {
  const upper = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return "🌍";

  const base = 0x1f1e6;
  const [a, b] = upper;
  return String.fromCodePoint(
    base + a.charCodeAt(0) - 65,
    base + b.charCodeAt(0) - 65,
  );
}

const COUNTRY_ENTRIES: Array<{ name: string; code: string }> = [
  { name: "대한민국", code: "KR" },
  { name: "일본", code: "JP" },
  { name: "태국", code: "TH" },
  { name: "베트남", code: "VN" },
  { name: "대만", code: "TW" },
  { name: "홍콩", code: "HK" },
  { name: "싱가포르", code: "SG" },
  { name: "미국", code: "US" },
  { name: "프랑스", code: "FR" },
  { name: "이탈리아", code: "IT" },
  { name: "영국", code: "GB" },
];

export const COUNTRIES: Country[] = COUNTRY_ENTRIES.map((entry) => ({
  ...entry,
  flag: countryCodeToFlag(entry.code),
}));

const byCode = new Map(COUNTRIES.map((c) => [c.code, c]));
const byName = new Map(COUNTRIES.map((c) => [c.name, c]));

/** 예전 데이터 호환 — 국가명 별칭 */
const LEGACY_NAME_ALIASES: Record<string, string> = {
  한국: "대한민국",
};

export function getCountryByCode(code: string): Country | undefined {
  return byCode.get(code.trim().toUpperCase());
}

export function getCountryByName(name: string): Country | undefined {
  const trimmed = name.trim();
  const resolved = LEGACY_NAME_ALIASES[trimmed] ?? trimmed;
  return byName.get(resolved);
}

/** 국가 코드로 국기 이모지 반환 */
export function getCountryFlag(code: string): string {
  const country = getCountryByCode(code);
  return country?.flag ?? countryCodeToFlag(code);
}

export function resolveCountryName(country: string): string {
  const trimmed = country.trim();

  const fromCode = getCountryByCode(trimmed);
  if (fromCode) return fromCode.name;

  const fromName = getCountryByName(trimmed);
  if (fromName) return fromName.name;

  return LEGACY_NAME_ALIASES[trimmed] ?? trimmed;
}

/** 저장된 여행 데이터에서 국가 코드 복원 */
export function resolveCountryCode(
  country: string,
  countryCode?: string,
  legacyFlagOrCode?: string,
): string {
  if (countryCode && getCountryByCode(countryCode)) {
    return countryCode.toUpperCase();
  }

  const fromCountryField = getCountryByCode(country);
  if (fromCountryField) return fromCountryField.code;

  const fromCountryName = getCountryByName(country);
  if (fromCountryName) return fromCountryName.code;

  if (legacyFlagOrCode && /^[A-Za-z]{2}$/.test(legacyFlagOrCode.trim())) {
    return legacyFlagOrCode.trim().toUpperCase();
  }

  return "";
}
