import { isUuid } from "@/lib/supabase";
import type { ChecklistItem } from "@/types/checklist";

/** legacy checklist id → uuid 변환 (Supabase 마이그레이션용) */
export function prepareChecklistsForSupabaseMigration(
  localItems: ChecklistItem[],
): ChecklistItem[] {
  return localItems.map((item) => {
    if (isUuid(item.id)) return item;
    return { ...item, id: crypto.randomUUID() };
  });
}
