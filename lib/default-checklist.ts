/** 기본 체크리스트 카테고리 */
export const CHECKLIST_CATEGORY_ORDER = [
  "예약",
  "여행 준비",
  "짐",
  "기타",
] as const;

export type ChecklistCategory = (typeof CHECKLIST_CATEGORY_ORDER)[number];

/** 직접 입력 항목 그룹 라벨 */
export const CHECKLIST_CUSTOM_CATEGORY = "직접 추가" as const;

export type ChecklistGroupLabel = ChecklistCategory | typeof CHECKLIST_CUSTOM_CATEGORY;

export interface DefaultChecklistEntry {
  category: ChecklistCategory;
  text: string;
}

/** 공통 여행 준비 기본 항목 */
export const DEFAULT_CHECKLIST_ENTRIES: DefaultChecklistEntry[] = [
  { category: "예약", text: "항공권 예약" },
  { category: "예약", text: "숙소 예약" },
  { category: "예약", text: "식당 예약" },
  { category: "예약", text: "액티비티 예약" },
  { category: "여행 준비", text: "여권 확인" },
  { category: "여행 준비", text: "eSIM 구매" },
  { category: "여행 준비", text: "여행자 보험" },
  { category: "여행 준비", text: "환전" },
  { category: "짐", text: "충전기" },
  { category: "짐", text: "보조배터리" },
  { category: "짐", text: "상비약" },
  { category: "짐", text: "세면도구" },
  { category: "기타", text: "체크인 완료" },
  { category: "기타", text: "공항 이동수단 확인" },
  { category: "기타", text: "신용카드 확인" },
];
