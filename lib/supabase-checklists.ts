import { prepareChecklistsForSupabaseMigration } from "@/lib/checklist-migration";
import { getSupabaseClient, logSupabaseQueryResult } from "@/lib/supabase";
import type { ChecklistItem } from "@/types/checklist";
import type {
  SupabaseChecklistInsert,
  SupabaseChecklistRow,
  SupabaseChecklistUpdate,
} from "@/types/supabase-checklist";

function checklistToSupabaseInsert(
  item: ChecklistItem,
  tripId: string,
  sortOrder: number,
): SupabaseChecklistInsert {
  return {
    id: item.id,
    trip_id: tripId,
    title: item.text,
    is_completed: item.checked,
    sort_order: sortOrder,
  };
}

function checklistToSupabaseUpdate(
  item: ChecklistItem,
  sortOrder: number,
): SupabaseChecklistUpdate {
  return {
    title: item.text,
    is_completed: item.checked,
    sort_order: sortOrder,
    updated_at: new Date().toISOString(),
  };
}

function supabaseFieldsEqual(
  a: SupabaseChecklistInsert,
  b: SupabaseChecklistInsert,
): boolean {
  return (
    a.trip_id === b.trip_id &&
    a.title === b.title &&
    a.is_completed === b.is_completed &&
    a.sort_order === b.sort_order
  );
}

function buildChecklistPayloadMap(
  items: ChecklistItem[],
  tripId: string,
): Map<string, SupabaseChecklistInsert> {
  return new Map(
    items.map((item, index) => [
      item.id,
      checklistToSupabaseInsert(item, tripId, index),
    ]),
  );
}

/** Supabase 행 → 앱 ChecklistItem */
export function supabaseRowToChecklistItem(
  row: SupabaseChecklistRow,
): ChecklistItem {
  return {
    id: row.id,
    text: row.title,
    checked: row.is_completed,
  };
}

/** trip_id 기준 체크리스트 목록 조회 */
export async function fetchSupabaseChecklistsByTripId(
  tripId: string,
): Promise<ChecklistItem[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client
    .from("checklists")
    .select("*")
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  logSupabaseQueryResult("checklists.select", { tripId, data }, error);
  if (error) throw error;

  return (data as SupabaseChecklistRow[]).map(supabaseRowToChecklistItem);
}

/** 체크리스트 항목 생성 */
export async function insertSupabaseChecklist(
  row: SupabaseChecklistInsert,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client.from("checklists").insert(row).select();

  logSupabaseQueryResult("checklists.insert", { row, data }, error);
  if (error) throw error;
}

/** 체크리스트 항목 수정 */
export async function updateSupabaseChecklist(
  id: string,
  row: SupabaseChecklistUpdate,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client.from("checklists").update(row).eq("id", id);

  logSupabaseQueryResult("checklists.update", { checklistId: id, row }, error);
  if (error) throw error;
}

/** 체크리스트 항목 삭제 */
export async function deleteSupabaseChecklist(
  checklistId: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client
    .from("checklists")
    .delete()
    .eq("id", checklistId);

  logSupabaseQueryResult("checklists.delete", { checklistId }, error);
  if (error) throw error;
}

/** checklists 배열 diff 동기화 */
export async function syncSupabaseChecklistsDiff(
  tripId: string,
  prevItems: ChecklistItem[],
  nextItems: ChecklistItem[],
): Promise<void> {
  const prevMap = buildChecklistPayloadMap(prevItems, tripId);
  const nextMap = buildChecklistPayloadMap(nextItems, tripId);

  const deletes = [...prevMap.keys()].filter((id) => !nextMap.has(id));
  const inserts = [...nextMap.keys()].filter((id) => !prevMap.has(id));
  const updates = [...nextMap.keys()].filter((id) => {
    if (!prevMap.has(id)) return false;
    return !supabaseFieldsEqual(prevMap.get(id)!, nextMap.get(id)!);
  });

  console.log("[Supabase Query] checklists.diff", {
    tripId,
    deletes,
    inserts,
    updates,
  });

  await Promise.all(deletes.map((id) => deleteSupabaseChecklist(id)));
  await Promise.all(inserts.map((id) => insertSupabaseChecklist(nextMap.get(id)!)));

  await Promise.all(
    updates.map((id) => {
      const sortOrder = nextItems.findIndex((item) => item.id === id);
      const item = nextItems.find((entry) => entry.id === id)!;
      return updateSupabaseChecklist(
        id,
        checklistToSupabaseUpdate(item, sortOrder >= 0 ? sortOrder : 0),
      );
    }),
  );
}

/**
 * LocalStorage → Supabase 일괄 이전
 * legacy checklist id 를 uuid 로 변환한다.
 */
export async function migrateLocalChecklistsToSupabase(
  tripId: string,
  localItems: ChecklistItem[],
): Promise<ChecklistItem[]> {
  if (localItems.length === 0) return [];

  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const migratedItems = prepareChecklistsForSupabaseMigration(localItems);
  const rows = migratedItems.map((item, index) =>
    checklistToSupabaseInsert(item, tripId, index),
  );

  const { data, error } = await client.from("checklists").insert(rows).select();

  logSupabaseQueryResult("checklists.migrate", { tripId, rows, data }, error);
  if (error) throw error;

  return migratedItems;
}
