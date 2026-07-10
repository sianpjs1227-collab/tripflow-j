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

/** DAY 하위 — 일정 / 경로 / 추천 (DAY·상단탭과 높이·폰트 통일) */
export default function ScheduleDaySubviewTabs({
  activeView,
  onChange,
}: ScheduleDaySubviewTabsProps) {
  return (
    <div
      className="flex gap-1 rounded-xl border border-border bg-background p-0.5"
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
              "flex h-8 flex-1 items-center justify-center rounded-lg px-2 text-[11px] font-medium transition-all duration-200 ease-out",
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
