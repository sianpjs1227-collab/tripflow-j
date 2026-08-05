import type { ListMemoItem, NoteType } from "@/types/note";

/** Supabase `memos` 테이블 행 */
export interface SupabaseMemoRow {
  id: string;
  trip_id: string;
  title: string;
  content: string;
  type?: NoteType | null;
  items?: ListMemoItem[] | null;
  /** 일반 메모 다중 사진 */
  images?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseMemoInsert {
  id: string;
  trip_id: string;
  title: string;
  content: string;
  type: NoteType;
  items: ListMemoItem[] | null;
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseMemoUpdate {
  title: string;
  content: string;
  type: NoteType;
  items: ListMemoItem[] | null;
  images: string[] | null;
  updated_at: string;
}
