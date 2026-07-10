import { prepareExpensesForSupabaseMigration } from "@/lib/expense-migration";
import {
  expenseCategoryLabels,
  getExpenseTitle,
} from "@/lib/expense-utils";
import { getSupabaseClient, isUuid, logSupabaseQueryResult } from "@/lib/supabase";
import type { Expense } from "@/types/expense";
import type { Event } from "@/types/event";
import type {
  SupabaseExpenseInsert,
  SupabaseExpenseRow,
  SupabaseExpenseUpdate,
} from "@/types/supabase-expense";

/** next dev(Strict Mode)에서 동일 expense.id insert 중복 실행 방지 — production에서는 사용하지 않음 */
const pendingExpenseInsertIds = new Set<string>();
const completedExpenseInsertIds = new Set<string>();

function isDevExpenseInsertDedupeEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

function shouldSkipDevExpenseInsert(expenseId: string): boolean {
  if (!isDevExpenseInsertDedupeEnabled()) return false;
  return (
    pendingExpenseInsertIds.has(expenseId) ||
    completedExpenseInsertIds.has(expenseId)
  );
}

function acquireDevExpenseInsert(expenseId: string): boolean {
  if (!isDevExpenseInsertDedupeEnabled()) return true;
  if (shouldSkipDevExpenseInsert(expenseId)) return false;
  pendingExpenseInsertIds.add(expenseId);
  return true;
}

function releaseDevExpenseInsert(expenseId: string, succeeded: boolean): void {
  if (!isDevExpenseInsertDedupeEnabled()) return;
  pendingExpenseInsertIds.delete(expenseId);
  if (succeeded) {
    completedExpenseInsertIds.add(expenseId);
  }
}

function resolveItineraryId(
  expense: Expense,
  validItineraryIds: ReadonlySet<string>,
): string | null {
  const itineraryId = expense.itineraryId?.trim();
  if (!itineraryId) return null;
  return validItineraryIds.has(itineraryId) ? itineraryId : null;
}

function resolveExpenseTitle(expense: Expense): string {
  return getExpenseTitle(expense) || expenseCategoryLabels[expense.category];
}

function expenseToSupabaseInsert(
  expense: Expense,
  tripId: string,
  validItineraryIds: ReadonlySet<string>,
): SupabaseExpenseInsert {
  return {
    id: expense.id,
    trip_id: tripId,
    itinerary_id: resolveItineraryId(expense, validItineraryIds),
    category: expense.category,
    title: resolveExpenseTitle(expense),
    amount: expense.amount,
    currency: expense.currency ?? "KRW",
    krw_amount: expense.krwAmount ?? null,
    paid_by: expense.paidBy ?? "me",
    memo: expense.memo ?? null,
    spent_at: expense.spentAt ?? `${expense.date}T00:00:00.000Z`,
  };
}

function expenseToSupabaseUpdate(
  expense: Expense,
  validItineraryIds: ReadonlySet<string>,
): SupabaseExpenseUpdate {
  return {
    itinerary_id: resolveItineraryId(expense, validItineraryIds),
    category: expense.category,
    title: resolveExpenseTitle(expense),
    amount: expense.amount,
    currency: expense.currency ?? "KRW",
    krw_amount: expense.krwAmount ?? null,
    paid_by: expense.paidBy ?? "me",
    memo: expense.memo ?? null,
    spent_at: expense.spentAt ?? `${expense.date}T00:00:00.000Z`,
    updated_at: new Date().toISOString(),
  };
}

function supabaseFieldsEqual(
  a: SupabaseExpenseInsert,
  b: SupabaseExpenseInsert,
): boolean {
  return (
    a.trip_id === b.trip_id &&
    a.itinerary_id === b.itinerary_id &&
    a.category === b.category &&
    a.title === b.title &&
    a.amount === b.amount &&
    a.currency === b.currency &&
    a.krw_amount === b.krw_amount &&
    a.paid_by === b.paid_by &&
    a.memo === b.memo &&
    a.spent_at === b.spent_at
  );
}

export function supabaseRowToExpense(row: SupabaseExpenseRow): Expense {
  return {
    id: row.id,
    itineraryId: row.itinerary_id ?? undefined,
    date: row.spent_at.slice(0, 10),
    amount: row.amount,
    currency: row.currency,
    krwAmount: row.krw_amount ?? undefined,
    category: row.category,
    title: row.title,
    paidBy: row.paid_by,
    memo: row.memo ?? undefined,
    spentAt: row.spent_at,
  };
}

function toValidItineraryIds(events: Event[]): Set<string> {
  return new Set(events.map((event) => event.id).filter(isUuid));
}

function buildExpensePayloadMap(
  expenses: Expense[],
  tripId: string,
  events: Event[],
): Map<string, SupabaseExpenseInsert> {
  const validItineraryIds = toValidItineraryIds(events);
  return new Map(
    expenses.map((expense) => [
      expense.id,
      expenseToSupabaseInsert(expense, tripId, validItineraryIds),
    ]),
  );
}

export async function fetchSupabaseExpensesByTripId(
  tripId: string,
): Promise<Expense[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client
    .from("expenses")
    .select("*")
    .eq("trip_id", tripId)
    .order("spent_at", { ascending: false })
    .order("created_at", { ascending: false });

  logSupabaseQueryResult("expenses.select", { tripId, data }, error);
  if (error) throw error;

  return (data as SupabaseExpenseRow[]).map(supabaseRowToExpense);
}

export async function insertSupabaseExpense(
  row: SupabaseExpenseInsert,
): Promise<void> {
  if (shouldSkipDevExpenseInsert(row.id)) {
    console.log("[Supabase Query] expenses.insert.skip_pending", {
      expenseId: row.id,
    });
    return;
  }

  if (!acquireDevExpenseInsert(row.id)) {
    console.log("[Supabase Query] expenses.insert.skip_pending", {
      expenseId: row.id,
    });
    return;
  }

  const client = getSupabaseClient();
  if (!client) {
    releaseDevExpenseInsert(row.id, false);
    throw new Error("Supabase client unavailable");
  }

  try {
    const { data, error } = await client.from("expenses").insert(row).select();

    logSupabaseQueryResult("expenses.insert", { row, data }, error);
    if (error) throw error;
    releaseDevExpenseInsert(row.id, true);
  } catch (error) {
    releaseDevExpenseInsert(row.id, false);
    throw error;
  }
}

export async function updateSupabaseExpense(
  id: string,
  row: SupabaseExpenseUpdate,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client.from("expenses").update(row).eq("id", id);

  logSupabaseQueryResult("expenses.update", { expenseId: id, row }, error);
  if (error) throw error;
}

export async function deleteSupabaseExpense(expenseId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client.from("expenses").delete().eq("id", expenseId);

  logSupabaseQueryResult("expenses.delete", { expenseId }, error);
  if (error) throw error;

  if (isDevExpenseInsertDedupeEnabled()) {
    completedExpenseInsertIds.delete(expenseId);
  }
}

export async function syncSupabaseExpensesDiff(
  tripId: string,
  prevExpenses: Expense[],
  nextExpenses: Expense[],
  prevEvents: Event[],
  nextEvents: Event[],
): Promise<void> {
  const prevMap = buildExpensePayloadMap(prevExpenses, tripId, prevEvents);
  const nextMap = buildExpensePayloadMap(nextExpenses, tripId, nextEvents);
  const validItineraryIds = toValidItineraryIds(nextEvents);

  const deletes = [...prevMap.keys()].filter((id) => !nextMap.has(id));
  const inserts = [...nextMap.keys()].filter((id) => !prevMap.has(id));
  const updates = [...nextMap.keys()].filter((id) => {
    if (!prevMap.has(id)) return false;
    return !supabaseFieldsEqual(prevMap.get(id)!, nextMap.get(id)!);
  });

  console.log("[Supabase Query] expenses.diff", {
    tripId,
    deletes,
    inserts,
    updates,
  });

  await Promise.all(deletes.map((id) => deleteSupabaseExpense(id)));
  await Promise.all(inserts.map((id) => insertSupabaseExpense(nextMap.get(id)!)));
  await Promise.all(
    updates.map((id) =>
      updateSupabaseExpense(
        id,
        expenseToSupabaseUpdate(nextExpenses.find((item) => item.id === id)!, validItineraryIds),
      ),
    ),
  );
}

export async function migrateLocalExpensesToSupabase(
  tripId: string,
  localExpenses: Expense[],
  events: Event[],
): Promise<Expense[]> {
  if (localExpenses.length === 0) return [];

  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const migratedExpenses = prepareExpensesForSupabaseMigration(localExpenses);
  const validItineraryIds = toValidItineraryIds(events);
  const rows = migratedExpenses.map((expense) =>
    expenseToSupabaseInsert(expense, tripId, validItineraryIds),
  );

  const rowsToInsert = rows.filter((row) => {
    if (!shouldSkipDevExpenseInsert(row.id)) return true;
    console.log("[Supabase Query] expenses.migrate.skip_pending", {
      expenseId: row.id,
    });
    return false;
  });

  const acquiredRows: SupabaseExpenseInsert[] = [];
  for (const row of rowsToInsert) {
    if (acquireDevExpenseInsert(row.id)) {
      acquiredRows.push(row);
      continue;
    }
    console.log("[Supabase Query] expenses.migrate.skip_pending", {
      expenseId: row.id,
    });
  }

  if (acquiredRows.length === 0) {
    return migratedExpenses;
  }

  try {
    const { data, error } = await client
      .from("expenses")
      .insert(acquiredRows)
      .select();

    logSupabaseQueryResult(
      "expenses.migrate",
      { tripId, rows: acquiredRows, data },
      error,
    );
    if (error) throw error;

    for (const row of acquiredRows) {
      releaseDevExpenseInsert(row.id, true);
    }
  } catch (error) {
    for (const row of acquiredRows) {
      releaseDevExpenseInsert(row.id, false);
    }
    throw error;
  }

  return migratedExpenses;
}
