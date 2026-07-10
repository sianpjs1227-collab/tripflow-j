import { prepareMemosForSupabaseMigration } from "@/lib/memo-migration";
import { normalizeNote } from "@/lib/note-utils";
import { getSupabaseClient, logSupabaseQueryResult } from "@/lib/supabase";
import type { Note } from "@/types/note";
import type {
  SupabaseMemoInsert,
  SupabaseMemoRow,
  SupabaseMemoUpdate,
} from "@/types/supabase-memo";

function noteToSupabaseInsert(note: Note, tripId: string): SupabaseMemoInsert {
  return {
    id: note.id,
    trip_id: tripId,
    title: note.title,
    content: note.content,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  };
}

function noteToSupabaseUpdate(note: Note): SupabaseMemoUpdate {
  return {
    title: note.title,
    content: note.content,
    updated_at: note.updatedAt,
  };
}

function supabaseFieldsEqual(
  a: SupabaseMemoInsert,
  b: SupabaseMemoInsert,
): boolean {
  return (
    a.trip_id === b.trip_id &&
    a.title === b.title &&
    a.content === b.content &&
    a.created_at === b.created_at &&
    a.updated_at === b.updated_at
  );
}

function buildMemoPayloadMap(
  notes: Note[],
  tripId: string,
): Map<string, SupabaseMemoInsert> {
  return new Map(
    notes.map((note) => [note.id, noteToSupabaseInsert(note, tripId)]),
  );
}

/** Supabase 행 → 앱 Note */
export function supabaseRowToNote(row: SupabaseMemoRow): Note {
  return normalizeNote({
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

/** trip_id 기준 메모 목록 조회 */
export async function fetchSupabaseMemosByTripId(
  tripId: string,
): Promise<Note[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client
    .from("memos")
    .select("*")
    .eq("trip_id", tripId)
    .order("updated_at", { ascending: false });

  logSupabaseQueryResult("memos.select", { tripId, data }, error);
  if (error) throw error;

  return (data as SupabaseMemoRow[]).map(supabaseRowToNote);
}

/** 메모 생성 */
export async function insertSupabaseMemo(
  row: SupabaseMemoInsert,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client.from("memos").insert(row).select();

  logSupabaseQueryResult("memos.insert", { row, data }, error);
  if (error) throw error;
}

/** 메모 수정 */
export async function updateSupabaseMemo(
  id: string,
  row: SupabaseMemoUpdate,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client.from("memos").update(row).eq("id", id);

  logSupabaseQueryResult("memos.update", { memoId: id, row }, error);
  if (error) throw error;
}

/** 메모 삭제 */
export async function deleteSupabaseMemo(memoId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client.from("memos").delete().eq("id", memoId);

  logSupabaseQueryResult("memos.delete", { memoId }, error);
  if (error) throw error;
}

/** memos 배열 diff 동기화 */
export async function syncSupabaseMemosDiff(
  tripId: string,
  prevNotes: Note[],
  nextNotes: Note[],
): Promise<void> {
  const prevMap = buildMemoPayloadMap(prevNotes, tripId);
  const nextMap = buildMemoPayloadMap(nextNotes, tripId);

  const deletes = [...prevMap.keys()].filter((id) => !nextMap.has(id));
  const inserts = [...nextMap.keys()].filter((id) => !prevMap.has(id));
  const updates = [...nextMap.keys()].filter((id) => {
    if (!prevMap.has(id)) return false;
    return !supabaseFieldsEqual(prevMap.get(id)!, nextMap.get(id)!);
  });

  console.log("[Supabase Query] memos.diff", {
    tripId,
    deletes,
    inserts,
    updates,
  });

  await Promise.all(deletes.map((id) => deleteSupabaseMemo(id)));
  await Promise.all(inserts.map((id) => insertSupabaseMemo(nextMap.get(id)!)));
  await Promise.all(
    updates.map((id) => {
      const note = nextNotes.find((item) => item.id === id)!;
      return updateSupabaseMemo(id, noteToSupabaseUpdate(note));
    }),
  );
}

/**
 * LocalStorage → Supabase 일괄 이전
 * legacy note id 를 uuid 로 변환한다.
 */
export async function migrateLocalMemosToSupabase(
  tripId: string,
  localNotes: Note[],
): Promise<Note[]> {
  if (localNotes.length === 0) return [];

  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const migratedNotes = prepareMemosForSupabaseMigration(localNotes);
  const rows = migratedNotes.map((note) => noteToSupabaseInsert(note, tripId));

  const { data, error } = await client.from("memos").insert(rows).select();

  logSupabaseQueryResult("memos.migrate", { tripId, rows, data }, error);
  if (error) throw error;

  return migratedNotes;
}
