import type { Trip, TripStatus } from "@/types/trip";
import { formatExpenseTotalDisplay } from "@/lib/expense-utils";
import { loadTripDetailData } from "@/lib/trip-detail-storage";
import { displayDateToIso } from "@/lib/trip-utils";
import {
  isCompletedTrip,
  isPlanningTrip,
  isTravelingTrip,
} from "@/lib/trip-status";

const DAY_MS = 1000 * 60 * 60 * 24;

const COUNTRY_GRADIENTS: Record<string, string> = {
  JP: "from-rose-400 via-red-400 to-orange-500",
  KR: "from-sky-400 via-blue-500 to-indigo-600",
  US: "from-blue-400 via-indigo-500 to-violet-600",
  FR: "from-blue-500 via-indigo-500 to-purple-600",
  IT: "from-emerald-400 via-teal-500 to-cyan-600",
  ES: "from-amber-400 via-orange-500 to-rose-500",
  TH: "from-fuchsia-400 via-pink-500 to-rose-500",
  VN: "from-red-400 via-rose-500 to-orange-500",
  GB: "from-slate-500 via-blue-600 to-indigo-700",
  AU: "from-cyan-400 via-sky-500 to-blue-600",
};

const FALLBACK_GRADIENTS = [
  "from-primary/80 via-blue-500 to-indigo-600",
  "from-violet-400 via-purple-500 to-fuchsia-600",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-amber-400 via-orange-500 to-rose-500",
  "from-sky-400 via-blue-500 to-indigo-600",
];

export interface TripHomeStats {
  scheduleCount: number;
  placeCount: number;
  expensePrimary: string;
  expenseSecondary: string | null;
  preparationRate: number | null;
}

export interface TravelDayProgress {
  currentDay: number;
  totalDays: number;
  percent: number;
  label: string;
}

function parseDisplayDate(displayDate: string): Date | null {
  const iso = displayDateToIso(displayDate);
  if (!iso) return null;
  return new Date(`${iso}T00:00:00`);
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** 시간대별 인사말 */
export function getHomeGreeting(date: Date = new Date()): string {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return "좋은 아침이에요 ☀️";
  if (hour >= 12 && hour < 18) return "좋은 오후예요 ☀️";
  if (hour >= 18 && hour < 22) return "좋은 저녁이에요 🌆";
  return "좋은 밤이에요 🌙";
}

function getTodayIso(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatNextScheduleDateLabel(
  eventDate: string,
  todayIso: string,
): string {
  if (eventDate === todayIso) return "오늘";

  const today = new Date(`${todayIso}T00:00:00`);
  const target = new Date(`${eventDate}T00:00:00`);
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / DAY_MS,
  );

  if (diffDays === 1) return "내일";
  if (diffDays > 1) return `D-${diffDays}`;
  return eventDate.slice(5).replace("-", ".");
}

export interface HeroScheduleSnapshot {
  todayCount: number;
  nextSchedule: {
    title: string;
    time: string;
    dateLabel: string;
  } | null;
}

/** Hero 카드용 오늘·다음 일정 요약 */
export function getHeroScheduleSnapshot(
  trip: Trip,
  now: Date = new Date(),
): HeroScheduleSnapshot {
  const detail = loadTripDetailData(trip.id);
  const todayIso = getTodayIso(now);
  const todayCount = detail.events.filter(
    (event) => event.date === todayIso,
  ).length;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const upcoming = [...detail.events]
    .filter((event) => {
      if (event.date > todayIso) return true;
      if (event.date < todayIso) return false;
      if (!event.time?.trim()) return true;
      const [hours, minutes] = event.time.split(":").map(Number);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) return true;
      return hours * 60 + minutes >= nowMinutes;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const aHas = Boolean(a.time?.trim());
      const bHas = Boolean(b.time?.trim());
      if (aHas && bHas) return (a.time as string).localeCompare(b.time as string);
      if (aHas) return -1;
      if (bHas) return 1;
      return 0;
    });

  const next = upcoming[0];

  return {
    todayCount,
    nextSchedule: next
      ? {
          title: next.title,
          time: next.time?.trim() || "시간 미정",
          dateLabel: formatNextScheduleDateLabel(next.date, todayIso),
        }
      : null,
  };
}

/** 화면 표시용 여행명 */
export function getTripDisplayName(trip: Trip): string {
  return trip.name.trim() || trip.city;
}

/** 여행중 → 예정 → 완료 우선순위로 대표 여행 선택 */
export function getPrimaryTrip(trips: Trip[]): Trip | null {
  const traveling = trips.find((trip) => isTravelingTrip(trip.status));
  if (traveling) return traveling;

  const planning = trips.find((trip) => isPlanningTrip(trip.status));
  if (planning) return planning;

  const completed = trips.find((trip) => isCompletedTrip(trip.status));
  return completed ?? null;
}

/** 국가 코드 기반 커버 그라데이션 */
export function getTripCoverGradient(countryCode: string): string {
  const code = countryCode.trim().toUpperCase();
  if (COUNTRY_GRADIENTS[code]) return COUNTRY_GRADIENTS[code];

  const index =
    code.length > 0
      ? (code.charCodeAt(0) + (code.charCodeAt(1) ?? 0)) %
        FALLBACK_GRADIENTS.length
      : 0;

  return FALLBACK_GRADIENTS[index];
}

/** D-Day 라벨 (예정 여행) */
export function getTripDDayLabel(startDate: string): string {
  const start = parseDisplayDate(startDate);
  if (!start) return "D-Day";

  const today = startOfDay(new Date());
  const diffDays = Math.round((start.getTime() - today.getTime()) / DAY_MS);

  if (diffDays === 0) return "D-Day";
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
}

/** 여행중 DAY 진행률 */
export function getTravelDayProgress(trip: Trip): TravelDayProgress | null {
  const start = parseDisplayDate(trip.startDate);
  const end = parseDisplayDate(trip.endDate);
  if (!start || !end) return null;

  const today = startOfDay(new Date());
  const totalDays =
    Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  const currentDay = Math.min(
    Math.max(Math.round((today.getTime() - start.getTime()) / DAY_MS) + 1, 1),
    totalDays,
  );
  const percent = Math.round((currentDay / totalDays) * 100);

  return {
    currentDay,
    totalDays,
    percent,
    label: `DAY ${currentDay} / ${totalDays}`,
  };
}

/** 대표 여행 서브타이틀 */
export function getPrimaryTripSubtitle(trip: Trip): string {
  const displayName = getTripDisplayName(trip);

  if (isTravelingTrip(trip.status)) {
    const progress = getTravelDayProgress(trip);
    return progress
      ? `${displayName} · ${progress.label}`
      : `${displayName} 여행이 진행 중이에요`;
  }

  if (isPlanningTrip(trip.status)) {
    return `${displayName} · ${getTripDDayLabel(trip.startDate)}`;
  }

  return `${displayName} · 여행 완료`;
}

/** 홈 카드용 여행 통계 */
export function getTripHomeStats(trip: Trip): TripHomeStats {
  const detail = loadTripDetailData(trip.id);
  const checklist = detail.checklist;
  const checkedCount = checklist.filter((item) => item.checked).length;
  const preparationRate =
    checklist.length > 0
      ? Math.round((checkedCount / checklist.length) * 100)
      : null;
  const expenseDisplay = formatExpenseTotalDisplay(detail.expenses, trip);

  return {
    scheduleCount: detail.events.length,
    placeCount: detail.places.length,
    expensePrimary: expenseDisplay.primary,
    expenseSecondary: expenseDisplay.secondary,
    preparationRate,
  };
}

/** 상태별 홈 배지 라벨 */
export function getTripStatusBadge(
  trip: Trip,
): { label: string; tone: "planning" | "traveling" | "completed" } {
  if (isTravelingTrip(trip.status)) {
    const progress = getTravelDayProgress(trip);
    return {
      label: progress?.label ?? "여행중",
      tone: "traveling",
    };
  }

  if (isPlanningTrip(trip.status)) {
    return {
      label: getTripDDayLabel(trip.startDate),
      tone: "planning",
    };
  }

  return {
    label: "완료",
    tone: "completed",
  };
}

/** 홈 Carousel용 여행 목록 — 여행중 → 출발일 가까운 예정 순 */
export function getHomeCarouselTrips(trips: Trip[]): Trip[] {
  const { traveling, planning } = groupTripsByPriority(trips);

  const sortedPlanning = [...planning].sort((a, b) => {
    const aIso = displayDateToIso(a.startDate) || a.startDate;
    const bIso = displayDateToIso(b.startDate) || b.startDate;
    return aIso.localeCompare(bIso);
  });

  return [...traveling, ...sortedPlanning];
}

/** 홈에 표시할 활성 여행 여부 */
export function hasActiveHomeTrips(trips: Trip[]): boolean {
  return getHomeCarouselTrips(trips).length > 0;
}

/** 우선순위별 여행 그룹 */
export function groupTripsByPriority(trips: Trip[]) {
  return {
    traveling: trips.filter((trip) => isTravelingTrip(trip.status)),
    planning: trips.filter((trip) => isPlanningTrip(trip.status)),
    completed: trips.filter((trip) => isCompletedTrip(trip.status)),
  };
}

/** 상태 톤 클래스 */
export function tripStatusToneClass(
  tone: "planning" | "traveling" | "completed",
): string {
  switch (tone) {
    case "planning":
      return "bg-primary/10 text-primary";
    case "traveling":
      return "bg-warning/15 text-warning";
    case "completed":
      return "bg-muted/15 text-muted";
  }
}

/** 대표 여행이 해당 상태인지 */
export function isTripStatus(
  status: TripStatus,
  trip: Trip | null,
): trip is Trip {
  return trip !== null && trip.status === status;
}
