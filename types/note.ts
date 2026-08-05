/**
 * 메모(Note)
 */

export type NoteType = "text" | "list";

/** 리스트 메모 항목 */
export interface ListMemoItem {
  id: string;
  name: string;
  memo?: string;
  /** data URL (선택, 1장) — 레거시 호환 */
  imageUrl?: string;
  /** 체크 상태 */
  checked?: boolean;
}

export interface Note {
  id: string;
  /** 없으면 text (레거시 호환) */
  type?: NoteType;
  title: string;
  content: string;
  /** 일반 메모 첨부 사진 (data URL 배열). 없으면 기존과 동일 */
  images?: string[];
  /** type === 'list' 일 때만 */
  items?: ListMemoItem[];
  createdAt: string;
  updatedAt: string;
}

/** 일반 메모 입력 폼 */
export interface NoteInput {
  title: string;
  content: string;
  images?: string[];
}

/** 리스트 메모 입력 폼 */
export interface ListNoteInput {
  title: string;
  items: ListMemoItem[];
}

/** 리스트 항목 입력 폼 */
export interface ListMemoItemInput {
  name: string;
  memo?: string;
  imageUrl?: string;
  checked?: boolean;
}
