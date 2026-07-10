/** Supabase `checklists` 테이블 행 */
export interface SupabaseChecklistRow {
  id: string;
  trip_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SupabaseChecklistInsert {
  id: string;
  trip_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
}

export interface SupabaseChecklistUpdate {
  title: string;
  is_completed: boolean;
  sort_order: number;
  updated_at: string;
}
