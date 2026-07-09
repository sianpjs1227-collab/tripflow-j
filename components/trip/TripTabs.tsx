"use client";

import {
  Calendar,
  CheckSquare,
  MapPin,
  StickyNote,
  Wallet,
} from "lucide-react";
import type { TripTab } from "@/types/trip";
import { STICKY_LAYER_VARS, useStickyLayer } from "@/hooks/useStickyLayer";
import { cn } from "@/lib/cn";

const TABS: { id: TripTab; label: string; icon: typeof Calendar }[] = [
  { id: "schedule", label: "일정", icon: Calendar },
  { id: "places", label: "장소", icon: MapPin },
  { id: "budget", label: "지출", icon: Wallet },
  { id: "checklist", label: "체크리스트", icon: CheckSquare },
  { id: "memo", label: "메모", icon: StickyNote },
];

interface TripTabsProps {
  activeTab: TripTab;
  onTabChange: (tab: TripTab) => void;
}

/** 여행 상세 페이지 탭 — Lucide 아이콘 + 텍스트 */
export default function TripTabs({ activeTab, onTabChange }: TripTabsProps) {
  const tabsRef = useStickyLayer(STICKY_LAYER_VARS.tripTabs);

  return (
    <nav
      ref={tabsRef}
      className="sticky-layer-trip-tabs -mx-1 mt-3 border-b border-border bg-background/95 py-1.5 backdrop-blur-md"
      aria-label="여행 상세 탭"
    >
      <div className="scrollbar-hide overflow-x-auto px-1">
        <div className="flex w-max min-w-full gap-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex shrink-0 flex-col items-center gap-0.5 rounded-xl border px-3.5 py-2 transition-all duration-200 ease-out sm:flex-1 sm:flex-row sm:justify-center sm:gap-1.5",
                  isActive
                    ? "border-border bg-card text-primary shadow-sm"
                    : "border-transparent text-muted hover:border-border hover:bg-card hover:text-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                    isActive ? "text-primary" : "text-muted",
                  )}
                  aria-hidden
                />
                <span className="whitespace-nowrap text-xs font-medium sm:text-sm">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
