import type { ExpenseCategory } from "@/types/expense";

export interface SupabaseExpenseRow {
  id: string;
  trip_id: string;
  itinerary_id: string | null;
  category: ExpenseCategory;
  title: string;
  amount: number;
  currency: string;
  krw_amount: number | null;
  paid_by: string;
  memo: string | null;
  spent_at: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseExpenseInsert {
  id: string;
  trip_id: string;
  itinerary_id: string | null;
  category: ExpenseCategory;
  title: string;
  amount: number;
  currency: string;
  krw_amount: number | null;
  paid_by: string;
  memo: string | null;
  spent_at: string;
}

export interface SupabaseExpenseUpdate {
  itinerary_id: string | null;
  category: ExpenseCategory;
  title: string;
  amount: number;
  currency: string;
  krw_amount: number | null;
  paid_by: string;
  memo: string | null;
  spent_at: string;
  updated_at: string;
}
