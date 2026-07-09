"use client";

import { cn } from "@/lib/cn";

export type ScheduleDaySubview = "schedule" | "route" | "recommend";

const SUBVIEWS: { id: ScheduleDaySubview; label: string }[] = [
  { id: "schedule", label: "일정" },
  { id: "route", label: "경로" },
  { id: "recommend", label: "추천" },
];

interface ScheduleDaySubviewTabsProps {
  activeView: ScheduleDaySubview;
  onChange: (view: ScheduleDaySubview) => void;
}

/** DAY 하위 — 일정 / 경로 / 추천 탭 */
export default function ScheduleDaySubviewTabs({
  activeView,
  onChange,
}: ScheduleDaySubviewTabsProps) {
  return (
    <div
      className="flex gap-1 rounded-2xl border border-border bg-background p-1"
      role="tablist"
      aria-label="일정 보기"
    >
      {SUBVIEWS.map((view) => {
        const isActive = activeView === view.id;

        return (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(view.id)}
            className={cn(
              "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ease-out",
              isActive
                ? "bg-card text-primary shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
}
