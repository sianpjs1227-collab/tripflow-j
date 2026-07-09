import type { ChecklistInput, ChecklistItem } from "@/types/checklist";
import {
  CHECKLIST_CATEGORY_ORDER,
  CHECKLIST_CUSTOM_CATEGORY,
  DEFAULT_CHECKLIST_ENTRIES,
  type ChecklistGroupLabel,
  type DefaultChecklistEntry,
} from "@/lib/default-checklist";

export function generateChecklistId(): string {
  return `checklist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createChecklistItem(input: ChecklistInput): ChecklistItem {
  return {
    id: generateChecklistId(),
    text: input.text.trim(),
    checked: false,
    category: input.category,
  };
}

export function createChecklistItemFromDefault(
  entry: DefaultChecklistEntry,
): ChecklistItem {
  return createChecklistItem({
    text: entry.text,
    category: entry.category,
  });
}

/** 기본 체크리스트 항목 전체 생성 */
export function createDefaultChecklistItems(): ChecklistItem[] {
  return DEFAULT_CHECKLIST_ENTRIES.map(createChecklistItemFromDefault);
}

export function updateChecklistItem(
  existing: ChecklistItem,
  input: ChecklistInput,
): ChecklistItem {
  return {
    ...existing,
    text: input.text.trim(),
    category: input.category ?? existing.category,
  };
}

/** 체크리스트에 이미 있는 항목 텍스트 집합 */
export function getExistingChecklistTexts(items: ChecklistItem[]): Set<string> {
  return new Set(items.map((item) => item.text.trim()));
}

/** 아직 추가되지 않은 기본 항목 */
export function getUnusedDefaultChecklistEntries(
  items: ChecklistItem[],
): DefaultChecklistEntry[] {
  const existing = getExistingChecklistTexts(items);
  return DEFAULT_CHECKLIST_ENTRIES.filter((entry) => !existing.has(entry.text));
}

export interface ChecklistCategoryGroup {
  category: ChecklistGroupLabel;
  items: ChecklistItem[];
}

/** 카테고리별 그룹 — 직접 추가 항목은 마지막 */
export function groupChecklistByCategory(
  items: ChecklistItem[],
): ChecklistCategoryGroup[] {
  const buckets = new Map<ChecklistGroupLabel, ChecklistItem[]>();

  for (const category of CHECKLIST_CATEGORY_ORDER) {
    buckets.set(category, []);
  }
  buckets.set(CHECKLIST_CUSTOM_CATEGORY, []);

  for (const item of items) {
    const category =
      item.category && CHECKLIST_CATEGORY_ORDER.includes(item.category)
        ? item.category
        : CHECKLIST_CUSTOM_CATEGORY;
    buckets.get(category)!.push(item);
  }

  const groups: ChecklistCategoryGroup[] = [];

  for (const category of CHECKLIST_CATEGORY_ORDER) {
    const groupItems = buckets.get(category)!;
    if (groupItems.length > 0) {
      groups.push({ category, items: groupItems });
    }
  }

  const customItems = buckets.get(CHECKLIST_CUSTOM_CATEGORY)!;
  if (customItems.length > 0) {
    groups.push({ category: CHECKLIST_CUSTOM_CATEGORY, items: customItems });
  }

  return groups;
}
