import type { Note, NoteInput } from "@/types/note";

export function generateNoteId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** 저장된 메모 데이터 정규화 (title 없는 예전 데이터 호환) */
export function normalizeNote(raw: Note & { title?: string }): Note {
  const content = raw.content?.trim() ?? "";
  const title =
    raw.title?.trim() ||
    content.split("\n")[0]?.trim().slice(0, 40) ||
    "메모";

  return {
    id: raw.id,
    title,
    content,
    createdAt: raw.createdAt ?? nowIso(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? nowIso(),
  };
}

export function createNote(input: NoteInput): Note {
  const timestamp = nowIso();
  return {
    id: generateNoteId(),
    title: input.title.trim(),
    content: input.content.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateNote(existing: Note, input: NoteInput): Note {
  return {
    ...existing,
    title: input.title.trim(),
    content: input.content.trim(),
    updatedAt: nowIso(),
  };
}

/** 메모 날짜 표시 (예: 2026.03.14) */
export function formatNoteDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}
