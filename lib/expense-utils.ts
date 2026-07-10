import type { Expense, ExpenseCategory, ExpenseInput } from "@/types/expense";
import type { Trip } from "@/types/trip";
import {
  convertToKrw,
  formatKrwAmount,
  formatLocalCurrencyAmount,
  tripHasExchangeRate,
} from "@/lib/currency-utils";

/** 분류 한글 라벨 */
export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  transport: "교통",
  food: "식비",
  cafe: "카페",
  shopping: "쇼핑",
  other: "기타",
};

/** 분류 아이콘 */
export const expenseCategoryIcons: Record<ExpenseCategory, string> = {
  transport: "🚕",
  food: "🍜",
  cafe: "☕",
  shopping: "🛍",
  other: "💸",
};

export const expenseCategories: ExpenseCategory[] = [
  "transport",
  "food",
  "cafe",
  "shopping",
  "other",
];

export function generateExpenseId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `expense-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** 금액 표시 — 통화 코드 (예: 1,280 JPY) */
export function formatExpenseAmount(
  amount: number,
  currencyCode = "KRW",
): string {
  return formatLocalCurrencyAmount(amount, currencyCode);
}

/** 지출 표시용 제목 (메모 또는 분류) */
export function getExpenseTitle(expense: Expense): string {
  if (expense.title?.trim()) {
    return expense.title.trim();
  }
  if (expense.memo?.trim()) {
    return expense.memo.trim();
  }
  const icon = expenseCategoryIcons[expense.category];
  return `${icon} ${expenseCategoryLabels[expense.category]}`;
}

/** 저장된·계산된 원화 금액 */
export function getExpenseKrwAmount(expense: Expense, trip: Trip): number {
  if (expense.krwAmount != null && !Number.isNaN(expense.krwAmount)) {
    return expense.krwAmount;
  }

  if (tripHasExchangeRate(trip)) {
    return convertToKrw(expense.amount, trip.exchangeRate!);
  }

  return expense.amount;
}

/** 지출 생성 — Trip 환율 기준으로 krwAmount 함께 저장 */
export function createExpenseFromInput(
  input: ExpenseInput,
  trip: Trip,
): Expense {
  const amount = Number(input.amount);
  const trimmedMemo = input.memo.trim();
  const currency = tripHasExchangeRate(trip) ? trip.currency : "KRW";
  const baseExpense = {
    id: generateExpenseId(),
    date: input.date,
    amount,
    category: input.category,
    currency,
    title: trimmedMemo || undefined,
    memo: trimmedMemo || undefined,
    paidBy: "me" as const,
    spentAt: `${input.date}T00:00:00.000Z`,
  };

  if (tripHasExchangeRate(trip)) {
    return {
      ...baseExpense,
      krwAmount: convertToKrw(amount, trip.exchangeRate!),
    };
  }

  return {
    ...baseExpense,
    krwAmount: amount,
  };
}

export interface ExpenseCategoryTotal {
  category: ExpenseCategory;
  primary: string;
  secondary: string | null;
  amount: number;
  krwAmount: number;
}

export interface ExpenseDisplayAmounts {
  title: string;
  primary: string;
  secondary: string | null;
}

/** 지출 목록 표시용 금액 */
export function formatExpenseDisplay(
  expense: Expense,
  trip: Trip,
): ExpenseDisplayAmounts {
  const title = getExpenseTitle(expense);

  if (tripHasExchangeRate(trip)) {
    return {
      title,
      primary: formatExpenseAmount(expense.amount, trip.currency),
      secondary: `≈ ${formatKrwAmount(getExpenseKrwAmount(expense, trip))}`,
    };
  }

  return {
    title,
    primary: formatKrwAmount(getExpenseKrwAmount(expense, trip)),
    secondary: null,
  };
}

export interface ExpenseTotalDisplay {
  primary: string;
  secondary: string | null;
}

/** 총 지출 표시 */
export function formatExpenseTotalDisplay(
  expenses: Expense[],
  trip: Trip,
): ExpenseTotalDisplay {
  if (tripHasExchangeRate(trip)) {
    const totalLocal = expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalKrw = expenses.reduce(
      (sum, item) => sum + getExpenseKrwAmount(item, trip),
      0,
    );

    return {
      primary: `총 ${formatExpenseAmount(totalLocal, trip.currency)}`,
      secondary: `≈ ${formatKrwAmount(totalKrw)}`,
    };
  }

  const totalKrw = expenses.reduce(
    (sum, item) => sum + getExpenseKrwAmount(item, trip),
    0,
  );

  return {
    primary: `총 ${formatKrwAmount(totalKrw)}`,
    secondary: null,
  };
}

export function getExpenseCategoryTotals(
  expenses: Expense[],
  trip: Trip,
): ExpenseCategoryTotal[] {
  return expenseCategories
    .map((category) => {
      const items = expenses.filter((expense) => expense.category === category);
      const amount = items.reduce((sum, expense) => sum + expense.amount, 0);
      const krwAmount = items.reduce(
        (sum, expense) => sum + getExpenseKrwAmount(expense, trip),
        0,
      );

      if (items.length === 0) {
        return null;
      }

      if (tripHasExchangeRate(trip)) {
        return {
          category,
          amount,
          krwAmount,
          primary: formatExpenseAmount(amount, trip.currency),
          secondary: `≈ ${formatKrwAmount(krwAmount)}`,
        };
      }

      return {
        category,
        amount,
        krwAmount,
        primary: formatKrwAmount(krwAmount),
        secondary: null,
      };
    })
    .filter((item): item is ExpenseCategoryTotal => item !== null);
}

/** 날짜 표시 (예: 2026.03.14) */
export function formatExpenseDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${year}.${month}.${day}`;
}
