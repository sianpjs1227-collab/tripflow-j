import { isUuid } from "@/lib/supabase";
import type { Expense } from "@/types/expense";

export function prepareExpensesForSupabaseMigration(
  localExpenses: Expense[],
): Expense[] {
  return localExpenses.map((expense) => {
    if (isUuid(expense.id)) return expense;
    return { ...expense, id: crypto.randomUUID() };
  });
}
