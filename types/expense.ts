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
  /** 일정 참조 ID (선택) */
  itineraryId?: string;
  /** 현지 금액(환율 있음) 또는 원화 금액(환율 없음) */
  amount: number;
  /** 저장 통화 코드 */
  currency?: string;
  /** 원화 환산 금액 — 저장 시 함께 기록 */
  krwAmount?: number;
  /** 분류 */
  category: ExpenseCategory;
  /** 지출 제목 */
  title?: string;
  /** 결제자 (향후 더치페이·공동정산 확장용) */
  paidBy?: string;
  /** 메모 (선택) */
  memo?: string;
  /** ISO 8601 datetime */
  spentAt?: string;
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
