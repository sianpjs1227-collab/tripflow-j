"use client";

import type { TripTab } from "@/types/trip";

const TABS: { id: TripTab; label: string }[] = [
  { id: "schedule", label: "일정" },
  { id: "places", label: "장소" },
  { id: "budget", label: "지출기록" },
  { id: "checklist", label: "체크리스트" },
  { id: "memo", label: "메모" },
];

interface TripTabsProps {
  activeTab: TripTab;
  onTabChange: (tab: TripTab) => void;
}

/** 여행 상세 페이지 상단 탭 */
export default function TripTabs({ activeTab, onTabChange }: TripTabsProps) {
  return (
    <div className="overflow-x-auto border-b border-[#ebebeb] dark:border-white/10">
      <div className="flex min-w-max px-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`
              px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
              ${
                activeTab === tab.id
                  ? "border-b-2 border-[#0A84FF] text-[#0A84FF]"
                  : "text-[#6e6e73] hover:text-[#111111] dark:text-[#a1a1a6] dark:hover:text-white"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
