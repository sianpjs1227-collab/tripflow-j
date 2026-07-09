import type { ChecklistCategory } from "@/lib/default-checklist";

/**
 * 체크리스트 항목
 */
export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  /** 기본 항목 카테고리 (직접 입력 시 생략 가능) */
  category?: ChecklistCategory;
}

/** 체크리스트 — 항목 배열 */
export type CheckList = ChecklistItem[];

/** 체크리스트 입력 폼 */
export interface ChecklistInput {
  text: string;
  category?: ChecklistCategory;
}
