"use client";

import { CheckCircle2, Star, TrendingUp } from "lucide-react";
import type { PlaceListFilter } from "@/lib/place-utils";
import { Chip } from "@/components/ui";

interface PlaceCategoryFilterProps {
  activeFilter: PlaceListFilter;
  favoriteCount: number;
  visitedCount: number;
  notVisitedCount: number;
  onChange: (filter: PlaceListFilter) => void;
}

const filterItems: {
  id: PlaceListFilter;
  label: string;
  icon?: "star" | "visited" | "not_visited" | "rating";
  future?: boolean;
}[] = [
  { id: "all", label: "전체" },
  { id: "favorites", label: "즐겨찾기", icon: "star" },
  { id: "not_visited", label: "미방문", icon: "not_visited" },
  { id: "visited", label: "방문", icon: "visited" },
  { id: "rating_sort", label: "평점순", icon: "rating", future: true },
];

/** 장소 탭 상단 필터 */
export default function PlaceCategoryFilter({
  activeFilter,
  favoriteCount,
  visitedCount,
  notVisitedCount,
  onChange,
}: PlaceCategoryFilterProps) {
  const countByFilter: Record<PlaceListFilter, number> = {
    all: 0,
    favorites: favoriteCount,
    not_visited: notVisitedCount,
    visited: visitedCount,
    rating_sort: 0,
  };

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex w-max min-w-full gap-2">
        {filterItems.map((item) => {
          const count = countByFilter[item.id];
          const countLabel = count > 0 && item.id !== "all" ? ` (${count})` : "";

          return (
            <Chip
              key={item.id}
              active={activeFilter === item.id}
              onClick={() => onChange(item.id)}
              title={item.future ? "평점순 정렬" : undefined}
            >
              {item.icon === "star" && (
                <Star className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
              {item.icon === "visited" && (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
              {item.icon === "rating" && (
                <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
              {item.label}
              {countLabel}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}

export type { PlaceListFilter };
