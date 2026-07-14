import type { Event } from "@/types/event";
import type { ScheduleItem } from "@/types/schedule";

/** 시간이 지정된 일정인지 (시간 미정 제외) */
export function hasScheduleTime(
  time: string | null | undefined,
): boolean {
  return Boolean(time?.trim());
}

/** 시간 비교 — 지정 일정 먼저, 미정은 뒤로 (확장·정렬용 SoT) */
export function compareScheduleTime(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const aHas = hasScheduleTime(a);
  const bHas = hasScheduleTime(b);
  if (aHas && bHas) return (a as string).localeCompare(b as string);
  if (aHas) return -1;
  if (bHas) return 1;
  return 0;
}

/** 시간 지정 / 시간 미정으로 분리 (시간순 섹션용) */
export function partitionScheduleItemsByTime(items: ScheduleItem[]): {
  timed: ScheduleItem[];
  untimed: ScheduleItem[];
} {
  const timed: ScheduleItem[] = [];
  const untimed: ScheduleItem[] = [];

  for (const item of items) {
    if (hasScheduleTime(item.time)) timed.push(item);
    else untimed.push(item);
  }

  timed.sort((a, b) => compareScheduleTime(a.time, b.time));
  return { timed, untimed };
}

/** 날짜 표시 (예: 2026.03.14) */
export function formatScheduleDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${year}.${month}.${day}`;
}

/** 탭용 월/일 표시 (예: 8/11) */
export function formatScheduleMonthDay(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${Number(month)}/${Number(day)}`;
}

/** DAY Chip용 월.일 표시 (예: 07.09) */
export function formatScheduleChipDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${month.padStart(2, "0")}.${day.padStart(2, "0")}`;
}

/** 날짜 → 시간 순으로 정렬 (시간 미정은 각 날짜 맨 뒤) */
export function sortEvents(items: Event[]): Event[] {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return compareScheduleTime(a.time, b.time);
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
  items: { date: string; time: string | null }[],
): { date: string; items: typeof items }[] {
  const sorted = [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return compareScheduleTime(a.time, b.time);
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
