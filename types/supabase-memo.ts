/** Supabase `memos` 테이블 행 */
export interface SupabaseMemoRow {
  id: string;
  trip_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseMemoInsert {
  id: string;
  trip_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseMemoUpdate {
  title: string;
  content: string;
  updated_at: string;
}
