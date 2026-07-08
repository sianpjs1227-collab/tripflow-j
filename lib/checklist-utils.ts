import type { ChecklistInput, ChecklistItem } from "@/types/checklist";

export function generateChecklistId(): string {
  return `checklist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createChecklistItem(input: ChecklistInput): ChecklistItem {
  return {
    id: generateChecklistId(),
    text: input.text.trim(),
    checked: false,
  };
}

export function updateChecklistItem(
  existing: ChecklistItem,
  input: ChecklistInput,
): ChecklistItem {
  return {
    ...existing,
    text: input.text.trim(),
  };
}
