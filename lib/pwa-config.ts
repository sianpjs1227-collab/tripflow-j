/** TripFlow PWA manifest 상수 — manifest.ts 와 메타데이터에서 공유 */

export const PWA_CONFIG = {
  name: "TripFlow J — 여행 계획",
  short_name: "TripFlow J",
  description: "계획적인 여행을 위한 여행 계획 앱, TripFlow J",
  start_url: "/",
  scope: "/",
  display: "standalone" as const,
  orientation: "portrait" as const,
  theme_color: "#F8FAFC",
  background_color: "#F8FAFC",
  lang: "ko",
  /** PWA 식별자 — 동일 id 로 재설치 시 기존 앱을 갱신 */
  id: "/",
} as const;
