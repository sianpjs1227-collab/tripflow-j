const HERO_COVER_COUNT = 20;

/** 빈 Home Hero 배경 — hero01.jpg ~ hero20.jpg */
export function pickRandomEmptyHeroCover(): string {
  const index = Math.floor(Math.random() * HERO_COVER_COUNT) + 1;
  return `/covers/hero${String(index).padStart(2, "0")}.jpg`;
}

export function getEmptyHeroCoverPath(index: number): string {
  const clamped = Math.min(Math.max(index, 1), HERO_COVER_COUNT);
  return `/covers/hero${String(clamped).padStart(2, "0")}.jpg`;
}

export const EMPTY_HERO_COVER_COUNT = HERO_COVER_COUNT;

/** SSR·초기 Hydration용 기본 커버 */
export const DEFAULT_EMPTY_HERO_COVER = getEmptyHeroCoverPath(1);
