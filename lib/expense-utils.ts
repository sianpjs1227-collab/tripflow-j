import type { ExpenseCategory } from "@/types/expense";

/** 분류 한글 라벨 */
export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  transport: "교통",
  food: "식비",
  cafe: "카페",
  shopping: "쇼핑",
  other: "기타",
};

export const expenseCategories: ExpenseCategory[] = [
  "transport",
  "food",
  "cafe",
  "shopping",
  "other",
];

export function generateExpenseId(): string {
  return `expense-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** 금액 표시 (예: 12,000원) */
export function formatExpenseAmount(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

/** 날짜 표시 (예: 2026.03.14) */
export function formatExpenseDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${year}.${month}.${day}`;
}
