/** 지출 분류 */
export type ExpenseCategory =
  | "transport"
  | "food"
  | "cafe"
  | "shopping"
  | "other";

/**
 * 지출(Expense)
 * 선택적으로 Place를 placeId로 참조할 수 있습니다.
 */
export interface Expense {
  id: string;
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 금액 */
  amount: number;
  /** 분류 */
  category: ExpenseCategory;
  /** Place 참조 ID (선택) — 예: 우나기노 에이토 식비 연결 */
  placeId?: string;
  /** 메모 (선택) */
  memo?: string;
}

/** @deprecated Expense 와 동일 — 기존 코드 호환용 */
export type ExpenseItem = Expense;

/** 지출 추가 폼 입력 */
export interface ExpenseInput {
  date: string;
  amount: string;
  category: ExpenseCategory;
  memo: string;
}
