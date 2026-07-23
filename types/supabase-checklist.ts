import type { ChecklistCategory } from "@/lib/default-checklist";

/** Supabase `checklists` 테이블 행 */
export interface SupabaseChecklistRow {
  id: string;
  trip_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  /** 기본 그룹 라벨. null/없음 → 직접 추가 */
  category?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseChecklistInsert {
  id: string;
  trip_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  category: ChecklistCategory | null;
}

export interface SupabaseChecklistUpdate {
  title: string;
  is_completed: boolean;
  sort_order: number;
  category: ChecklistCategory | null;
  updated_at: string;
}
