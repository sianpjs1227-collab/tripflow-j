/**
 * 체크리스트 항목
 */
export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

/** 체크리스트 — 항목 배열 */
export type CheckList = ChecklistItem[];

/** 체크리스트 입력 폼 */
export interface ChecklistInput {
  text: string;
}
