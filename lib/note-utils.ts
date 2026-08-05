import type {
  ListMemoItem,
  ListMemoItemInput,
  ListNoteInput,
  Note,
  NoteInput,
  NoteType,
} from "@/types/note";

export function generateNoteId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function generateListMemoItemId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `memo-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function getNoteType(note: Pick<Note, "type">): NoteType {
  return note.type === "list" ? "list" : "text";
}

function normalizeImages(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const images = raw
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
  return images.length > 0 ? images : undefined;
}

function normalizeListMemoItem(raw: Partial<ListMemoItem>): ListMemoItem | null {
  const name = raw.name?.trim() ?? "";
  if (!name) return null;

  const memo = raw.memo?.trim() || undefined;
  const imageUrl = raw.imageUrl?.trim() || undefined;
  const checked = raw.checked === true;

  return {
    id: raw.id?.trim() || generateListMemoItemId(),
    name,
    ...(memo ? { memo } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(checked ? { checked: true } : {}),
  };
}

/** 저장된 메모 데이터 정규화 (title 없는 예전 데이터 호환) */
export function normalizeNote(raw: Note & { title?: string }): Note {
  const type = getNoteType(raw);
  const content = raw.content?.trim() ?? "";
  const title =
    raw.title?.trim() ||
    (type === "list"
      ? "리스트 메모"
      : content.split("\n")[0]?.trim().slice(0, 40) || "메모");
  const images = normalizeImages(raw.images);

  if (type === "list") {
    const items = (Array.isArray(raw.items) ? raw.items : [])
      .map((item) => normalizeListMemoItem(item))
      .filter((item): item is ListMemoItem => item != null);

    return {
      id: raw.id,
      type: "list",
      title,
      content: "",
      items,
      createdAt: raw.createdAt ?? nowIso(),
      updatedAt: raw.updatedAt ?? raw.createdAt ?? nowIso(),
    };
  }

  return {
    id: raw.id,
    type: "text",
    title,
    content,
    ...(images ? { images } : {}),
    createdAt: raw.createdAt ?? nowIso(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? nowIso(),
  };
}

export function createNote(input: NoteInput): Note {
  const timestamp = nowIso();
  const images = normalizeImages(input.images);
  return {
    id: generateNoteId(),
    type: "text",
    title: input.title.trim(),
    content: input.content.trim(),
    ...(images ? { images } : {}),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateNote(existing: Note, input: NoteInput): Note {
  const images = normalizeImages(input.images);
  return {
    ...existing,
    type: "text",
    title: input.title.trim(),
    content: input.content.trim(),
    images,
    items: undefined,
    updatedAt: nowIso(),
  };
}

export function createListNote(input: ListNoteInput): Note {
  const timestamp = nowIso();
  const items = input.items
    .map((item) => normalizeListMemoItem(item))
    .filter((item): item is ListMemoItem => item != null);

  return {
    id: generateNoteId(),
    type: "list",
    title: input.title.trim() || "리스트 메모",
    content: "",
    items,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateListNote(existing: Note, input: ListNoteInput): Note {
  const items = input.items
    .map((item) => normalizeListMemoItem(item))
    .filter((item): item is ListMemoItem => item != null);

  return {
    ...existing,
    type: "list",
    title: input.title.trim() || existing.title || "리스트 메모",
    content: "",
    images: undefined,
    items,
    updatedAt: nowIso(),
  };
}

export function createListMemoItem(input: ListMemoItemInput): ListMemoItem {
  const memo = input.memo?.trim() || undefined;
  const imageUrl = input.imageUrl?.trim() || undefined;
  const checked = input.checked === true;

  return {
    id: generateListMemoItemId(),
    name: input.name.trim(),
    ...(memo ? { memo } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(checked ? { checked: true } : {}),
  };
}

export function updateListMemoItem(
  existing: ListMemoItem,
  input: ListMemoItemInput,
): ListMemoItem {
  const memo = input.memo?.trim() || undefined;
  const imageUrl = input.imageUrl?.trim() || undefined;
  const checked = input.checked === true;

  return {
    id: existing.id,
    name: input.name.trim(),
    ...(memo ? { memo } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(checked ? { checked: true } : {}),
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
