"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, OverlayLayer, Text } from "@/components/ui";

const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0"),
);

const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0"),
);

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;

function parseTimeParts(value: string): { hour: string; minute: string } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return { hour: "10", minute: "00" };

  const hourNum = Math.min(23, Math.max(0, Number(match[1])));
  const minuteNum = Math.min(59, Math.max(0, Number(match[2])));
  const snapped = Math.round(minuteNum / 5) * 5;
  const minute = snapped === 60 ? 55 : snapped;

  return {
    hour: String(hourNum).padStart(2, "0"),
    minute: String(minute).padStart(2, "0"),
  };
}

function formatTime(hour: string, minute: string): string {
  return `${hour}:${minute}`;
}

interface ScrollColumnProps {
  values: string[];
  selected: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

function ScrollColumn({
  values,
  selected,
  onChange,
  ariaLabel,
}: ScrollColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<number | null>(null);
  const isProgrammatic = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const index = Math.max(0, values.indexOf(selected));
    isProgrammatic.current = true;
    el.scrollTop = index * ITEM_HEIGHT;
    window.setTimeout(() => {
      isProgrammatic.current = false;
    }, 50);
  }, [selected, values]);

  const snapToNearest = () => {
    const el = ref.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / ITEM_HEIGHT);
    const clamped = Math.min(values.length - 1, Math.max(0, index));
    const next = values[clamped];
    el.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: "smooth" });
    if (next !== selected) onChange(next);
  };

  const handleScroll = () => {
    if (isProgrammatic.current) return;
    if (scrollTimer.current != null) {
      window.clearTimeout(scrollTimer.current);
    }
    scrollTimer.current = window.setTimeout(() => {
      snapToNearest();
    }, 80);
  };

  return (
    <div className="relative flex-1">
      <div
        ref={ref}
        className="h-[220px] snap-y snap-mandatory overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "y mandatory" }}
        onScroll={handleScroll}
        role="listbox"
        aria-label={ariaLabel}
      >
        <div style={{ height: ITEM_HEIGHT * 2 }} aria-hidden />
        {values.map((value) => {
          const isSelected = value === selected;
          return (
            <button
              key={value}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onChange(value)}
              className={cn(
                "flex w-full snap-center items-center justify-center text-2xl tabular-nums transition-colors",
                isSelected
                  ? "font-bold text-foreground"
                  : "font-medium text-muted/50",
              )}
              style={{ height: ITEM_HEIGHT }}
            >
              {value}
            </button>
          );
        })}
        <div style={{ height: ITEM_HEIGHT * 2 }} aria-hidden />
      </div>
    </div>
  );
}

interface TimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  clearLabel?: string;
}

/**
 * 24시간 스크롤 Time Picker — Hour 00~23, Minute 5분 단위
 */
export default function TimePicker({
  label,
  value,
  onChange,
  placeholder = "시간 선택",
  onClear,
  clearLabel = "제거",
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const initial = parseTimeParts(value || "10:00");
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  useEffect(() => {
    if (!open) return;
    const parts = parseTimeParts(value || "10:00");
    setHour(parts.hour);
    setMinute(parts.minute);
  }, [open, value]);

  const handleConfirm = () => {
    onChange(formatTime(hour, minute));
    setOpen(false);
  };

  return (
    <div className="block space-y-2">
      <Text variant="label" as="span">
        {label}
      </Text>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex min-h-12 flex-1 items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 text-left transition-colors",
            "active:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          )}
        >
          <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span
            className={cn(
              "text-base font-semibold tabular-nums",
              value ? "text-foreground" : "font-normal text-muted",
            )}
          >
            {value || placeholder}
          </span>
        </button>

        {onClear && value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-12 shrink-0 px-3 text-muted"
          >
            {clearLabel}
          </Button>
        )}
      </div>

      <OverlayLayer
        isOpen={open}
        sheet
        onClose={() => setOpen(false)}
        closeLabel="시간 선택 닫기"
      >
        <Text variant="title-sm" as="h2" className="text-xl font-bold">
          {label}
        </Text>
        <Text variant="muted" className="mt-1">
          시·분을 스크롤해 선택하세요 (5분 단위)
        </Text>

        <div className="relative mt-4 rounded-xl border border-border bg-background px-2 py-1">
          <div
            className="pointer-events-none absolute inset-x-2 top-1/2 z-10 -translate-y-1/2 rounded-xl border border-primary/25 bg-primary/10"
            style={{ height: ITEM_HEIGHT }}
            aria-hidden
          />
          <div
            className="relative flex gap-2"
            style={{ height: PICKER_HEIGHT }}
          >
            <ScrollColumn
              values={HOURS}
              selected={hour}
              onChange={setHour}
              ariaLabel="시"
            />
            <div className="flex items-center text-2xl font-bold text-muted" aria-hidden>
              :
            </div>
            <ScrollColumn
              values={MINUTES}
              selected={minute}
              onChange={setMinute}
              ariaLabel="분"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            취소
          </Button>
          <Button type="button" onClick={handleConfirm} className="flex-1">
            확인
          </Button>
        </div>
      </OverlayLayer>
    </div>
  );
}
