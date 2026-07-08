import type { Event } from "@/types/event";

/** 날짜 표시 (예: 2026.03.14) */
export function formatScheduleDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${year}.${month}.${day}`;
}

/** 날짜 → 시간 순으로 정렬 */
export function sortEvents(items: Event[]): Event[] {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
}

/** 날짜별로 묶기 */
export function groupEventsByDate(
  items: Event[],
): { date: string; items: Event[] }[] {
  const sorted = sortEvents(items);
  const groups: { date: string; items: Event[] }[] = [];

  for (const item of sorted) {
    const last = groups[groups.length - 1];
    if (last?.date === item.date) {
      last.items.push(item);
    } else {
      groups.push({ date: item.date, items: [item] });
    }
  }

  return groups;
}

/** @deprecated groupEventsByDate 사용 — ScheduleItem 호환 */
export function groupSchedulesByDate(
  items: { date: string; time: string }[],
): { date: string; items: typeof items }[] {
  const sorted = [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
  const groups: { date: string; items: typeof items }[] = [];

  for (const item of sorted) {
    const last = groups[groups.length - 1];
    if (last?.date === item.date) {
      last.items.push(item);
    } else {
      groups.push({ date: item.date, items: [item] });
    }
  }

  return groups;
}

/** 표시용 날짜(YYYY.MM.DD) → ISO 날짜(YYYY-MM-DD) */
export function displayDateToScheduleIso(displayDate: string): string {
  const [year, month, day] = displayDate.split(".").map((part) => part.trim());
  return `${year}-${month}-${day}`;
}

/** 여행 시작일~종료일 사이 모든 날짜 목록 생성 */
export function buildTripDates(
  startDisplayDate: string,
  endDisplayDate: string,
): string[] {
  const startIso = displayDateToScheduleIso(startDisplayDate);
  const endIso = displayDateToScheduleIso(endDisplayDate);
  const dates: string[] = [];

  const current = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);

  while (current.getTime() <= end.getTime()) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
