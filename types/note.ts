/**
 * 메모(Note)
 */
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/** 메모 입력 폼 */
export interface NoteInput {
  title: string;
  content: string;
}
