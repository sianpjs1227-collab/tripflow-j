/** 빠른 일정 입력(Quick Schedule) — UI 전용, title 문자열로 호환 */

export type QuickScheduleCategoryId =
  | "meal"
  | "sightseeing"
  | "shopping"
  | "cafe"
  | "stay"
  | "transfer"
  | "booking"
  | "transit"
  | "other";

export interface QuickScheduleCategory {
  id: QuickScheduleCategoryId;
  emoji: string;
  label: string;
  /** 세부 항목 라벨 — 선택 시 title에 입력. 빈 배열이면 직접 입력만 */
  items: string[];
}

export const QUICK_SCHEDULE_CATEGORIES: QuickScheduleCategory[] = [
  {
    id: "meal",
    emoji: "🍳",
    label: "식사",
    items: ["아침", "점심", "저녁", "야식"],
  },
  {
    id: "sightseeing",
    emoji: "📍",
    label: "관광",
    items: ["관광", "공원", "전망대", "박물관", "신사", "사진촬영"],
  },
  {
    id: "shopping",
    emoji: "🛍",
    label: "쇼핑",
    items: ["쇼핑", "면세점", "기념품", "마트", "드럭스토어"],
  },
  {
    id: "cafe",
    emoji: "☕",
    label: "카페",
    items: ["카페", "디저트"],
  },
  {
    id: "stay",
    emoji: "🏨",
    label: "숙소",
    items: ["체크인", "체크아웃", "휴식"],
  },
  {
    id: "transfer",
    emoji: "✈",
    label: "이동",
    items: ["비행기", "기차", "버스", "택시", "도보", "렌터카"],
  },
  {
    id: "booking",
    emoji: "🎟",
    label: "예약",
    items: ["공연", "티켓", "예약"],
  },
  {
    id: "transit",
    emoji: "🚇",
    label: "교통",
    items: ["지하철", "환승"],
  },
  {
    id: "other",
    emoji: "📝",
    label: "기타",
    items: [],
  },
];

export interface QuickScheduleMatch {
  categoryId: QuickScheduleCategoryId;
  emoji: string;
  itemLabel: string;
}

/** 세부 항목 라벨 → 카테고리 (긴 라벨 우선 매칭용) */
const ITEM_MATCHERS: { label: string; category: QuickScheduleCategory }[] =
  QUICK_SCHEDULE_CATEGORIES.flatMap((category) =>
    category.items.map((label) => ({ label, category })),
  ).sort((a, b) => b.label.length - a.label.length);

function titleMatchesItem(title: string, itemLabel: string): boolean {
  const trimmed = title.trim();
  if (!trimmed) return false;
  if (trimmed === itemLabel) return true;
  if (trimmed.startsWith(`${itemLabel} `)) return true;
  if (trimmed.startsWith(`${itemLabel}(`)) return true;
  if (trimmed.startsWith(`${itemLabel}（`)) return true;
  return false;
}

/**
 * 기존 title에서 Quick Schedule 아이콘 추론.
 * DB에 카테고리 컬럼 없이 호환 유지.
 */
export function inferQuickScheduleFromTitle(
  title: string,
): QuickScheduleMatch | null {
  for (const { label, category } of ITEM_MATCHERS) {
    if (titleMatchesItem(title, label)) {
      return {
        categoryId: category.id,
        emoji: category.emoji,
        itemLabel: label,
      };
    }
  }
  return null;
}

export function getQuickScheduleCategory(
  id: QuickScheduleCategoryId,
): QuickScheduleCategory | undefined {
  return QUICK_SCHEDULE_CATEGORIES.find((category) => category.id === id);
}
