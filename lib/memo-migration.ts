import { isUuid } from "@/lib/supabase";
import type { Note } from "@/types/note";

/** legacy note id → uuid 변환 (Supabase 마이그레이션용) */
export function prepareMemosForSupabaseMigration(localNotes: Note[]): Note[] {
  return localNotes.map((note) => {
    if (isUuid(note.id)) return note;
    return { ...note, id: crypto.randomUUID() };
  });
}
