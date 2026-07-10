"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { calculateDuration, formatDisplayDate } from "@/lib/trip-utils";
import { cn } from "@/lib/cn";
import { Button, Text } from "@/components/ui";

interface TripDateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function parseIsoLocal(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function toIsoLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function compareDay(a: Date, b: Date): number {
  return startOfDay(a).getTime() - startOfDay(b).getTime();
}

function buildMonthCells(viewDate: Date): (Date | null)[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = first.getDay();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leading; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * 여행 기간 Date Range Picker — 한 캘린더에서 시작·종료일 선택
 */
export default function TripDateRangePicker({
  startDate,
  endDate,
  onChange,
}: TripDateRangePickerProps) {
  const start = parseIsoLocal(startDate);
  const end = parseIsoLocal(endDate);
  const today = startOfDay(new Date());

  const [viewDate, setViewDate] = useState(() => {
    const seed = start ?? end ?? today;
    return new Date(seed.getFullYear(), seed.getMonth(), 1);
  });
  const [pickingEnd, setPickingEnd] = useState(() =>
    Boolean(start && !end),
  );

  useEffect(() => {
    setPickingEnd(Boolean(startDate && !endDate));
  }, [startDate, endDate]);

  const monthLabel = `${viewDate.getFullYear()}년 ${viewDate.getMonth() + 1}월`;
  const cells = useMemo(() => buildMonthCells(viewDate), [viewDate]);

  const rangeLabel =
    start && end
      ? `${formatDisplayDate(startDate)} ~ ${formatDisplayDate(endDate)}`
      : start
        ? `${formatDisplayDate(startDate)} ~ 종료일 선택`
        : "여행 기간을 선택하세요";

  const durationLabel =
    startDate && endDate && endDate >= startDate
      ? calculateDuration(startDate, endDate)
      : null;

  const handlePrevMonth = () => {
    setViewDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setViewDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  const handleSelectDay = (day: Date) => {
    const iso = toIsoLocal(day);

    if (!start || (start && end && !pickingEnd)) {
      onChange({ startDate: iso, endDate: "" });
      setPickingEnd(true);
      return;
    }

    if (compareDay(day, start) < 0) {
      onChange({ startDate: iso, endDate: "" });
      setPickingEnd(true);
      return;
    }

    onChange({ startDate, endDate: iso });
    setPickingEnd(false);
  };

  const isInRange = (day: Date) => {
    if (!start || !end) return false;
    return compareDay(day, start) > 0 && compareDay(day, end) < 0;
  };

  return (
    <div className="block space-y-2">
      <Text variant="label" as="span">
        여행 기간
      </Text>

      <div className="rounded-xl border border-border bg-card px-3.5 py-3">
        <div className="flex items-start gap-2.5">
          <CalendarDays
            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <Text
              variant="body-medium"
              className={cn(
                "font-medium",
                !start && "text-muted font-normal",
              )}
            >
              {rangeLabel}
            </Text>
            {durationLabel && (
              <Text variant="caption" className="mt-0.5 text-primary">
                {durationLabel}
              </Text>
            )}
            {!durationLabel && pickingEnd && start && (
              <Text variant="caption" className="mt-0.5">
                캘린더에서 마지막 날짜를 눌러 주세요
              </Text>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePrevMonth}
            className="h-10 w-10 shrink-0 p-0 text-muted"
            aria-label="이전 달"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Button>
          <Text variant="body-medium" className="font-semibold">
            {monthLabel}
          </Text>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="h-10 w-10 shrink-0 p-0 text-muted"
            aria-label="다음 달"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-y-1 text-center">
          {WEEKDAYS.map((label) => (
            <Text
              key={label}
              variant="caption"
              className={cn(
                "py-1 text-[11px] font-medium",
                label === "일" && "text-danger/80",
              )}
            >
              {label}
            </Text>
          ))}

          {cells.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="h-11" />;
            }

            const iso = toIsoLocal(day);
            const isStart = start != null && isSameDay(day, start);
            const isEnd = end != null && isSameDay(day, end);
            const inRange = isInRange(day);
            const isToday = isSameDay(day, today);
            const isEndpoint = isStart || isEnd;
            const isSunday = day.getDay() === 0;

            return (
              <button
                key={iso}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={cn(
                  "relative flex h-11 items-center justify-center text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  inRange && "bg-primary/10",
                  isStart && end && "rounded-l-full bg-primary/10",
                  isEnd && start && "rounded-r-full bg-primary/10",
                  isStart && end && isSameDay(start, end) && "rounded-full",
                )}
                aria-label={`${day.getMonth() + 1}월 ${day.getDate()}일`}
                aria-pressed={isEndpoint}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full",
                    isEndpoint && "bg-primary font-semibold text-white",
                    !isEndpoint && isToday && "ring-1 ring-primary/40",
                    !isEndpoint && isSunday && "text-danger",
                    !isEndpoint && !isSunday && "text-foreground",
                    !isEndpoint && "active:bg-primary/10",
                  )}
                >
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
