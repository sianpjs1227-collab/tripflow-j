"use client";

import type { GapCategoryFilter } from "@/lib/day-gap-recommendations";
import { gapRecommendationTabs } from "@/lib/day-gap-recommendations";
import { Chip } from "@/components/ui";

interface GapCategoryTabsProps {
  activeFilter: GapCategoryFilter;
  onChange: (filter: GapCategoryFilter) => void;
}

/** 빈 시간 추천 카테고리 탭 */
export default function GapCategoryTabs({
  activeFilter,
  onChange,
}: GapCategoryTabsProps) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex w-max min-w-full gap-2">
        {gapRecommendationTabs.map((tab) => (
          <Chip
            key={`${tab.filter}-${tab.label}`}
            active={activeFilter === tab.filter}
            onClick={() => onChange(tab.filter)}
          >
            {tab.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
