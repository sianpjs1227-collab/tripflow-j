import type { ChecklistItem } from "@/types/checklist";
import type { Event } from "@/types/event";
import type { Expense } from "@/types/expense";
import type { Note } from "@/types/note";
import type { Place } from "@/types/place";

/**
 * Trip 하위 데이터 묶음
 * Trip(메타) + TripDetailData(상세)로 여행 전체를 구성합니다.
 */
export interface TripDetailData {
  places: Place[];
  events: Event[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  notes: Note[];
}

/** 빈 TripDetailData 생성 */
export function createEmptyTripDetailData(): TripDetailData {
  return {
    places: [],
    events: [],
    expenses: [],
    checklist: [],
    notes: [],
  };
}
