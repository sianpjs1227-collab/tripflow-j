"use client";

import { useEffect, useMemo, useState } from "react";
import { Hourglass } from "lucide-react";
import type { Place } from "@/types/place";
import type { ScheduleItem } from "@/types/schedule";
import type { GeoPosition } from "@/lib/directions";
import { getCurrentPosition } from "@/lib/directions";
import { analyzeDayGaps, type DayGap } from "@/lib/day-schedule-utils";
import {
  applyGapRecommendationFilter,
  getDefaultGapCategoryFilter,
  getGapRecommendations,
  getPreviousPlaceCategory,
  type GapCategoryFilter,
  type GapRecommendedPlace,
} from "@/lib/day-gap-recommendations";
import PlaceListCard from "@/components/trip/places/PlaceListCard";
import { Card, Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import GapCategoryTabs from "./GapCategoryTabs";

interface DayGapSectionProps {
  dayItems: ScheduleItem[];
  places: Place[];
  onOpenPlace: (place: GapRecommendedPlace, gap: DayGap) => void;
  className?: string;
}

/** 빈 시간 분석 + KML 장소 추천 */
export default function DayGapSection({
  dayItems,
  places,
  onOpenPlace,
  className,
}: DayGapSectionProps) {
  const [userPosition, setUserPosition] = useState<GeoPosition | null>(null);
  const [categoryFilter, setCategoryFilter] =
    useState<GapCategoryFilter>("all");
  const [filterTouched, setFilterTouched] = useState(false);

  const gaps = useMemo(() => analyzeDayGaps(dayItems), [dayItems]);

  const scheduledPlaceIds = useMemo(
    () => new Set(dayItems.map((item) => item.placeId).filter(Boolean)),
    [dayItems],
  );

  const gapRecommendations = useMemo(() => {
    return gaps.map((gap) => ({
      gap,
      allPlaces: getGapRecommendations(
        gap,
        dayItems,
        places,
        scheduledPlaceIds,
        userPosition,
      ),
      previousCategory: getPreviousPlaceCategory(gap, dayItems, places),
    }));
  }, [gaps, dayItems, places, scheduledPlaceIds, userPosition]);

  const suggestedFilter = useMemo(() => {
    const first = gapRecommendations[0];
    if (!first) return "all" as GapCategoryFilter;

    return getDefaultGapCategoryFilter(
      first.gap,
      dayItems,
      places,
      first.allPlaces,
    );
  }, [gapRecommendations, dayItems, places]);

  useEffect(() => {
    if (gaps.length === 0) return;

    void getCurrentPosition()
      .then(setUserPosition)
      .catch(() => {
        // 위치 없이 일정 장소 기준으로 추천
      });
  }, [gaps.length]);

  useEffect(() => {
    if (!filterTouched && gaps.length > 0) {
      setCategoryFilter(suggestedFilter);
    }
  }, [suggestedFilter, filterTouched, gaps.length]);

  useEffect(() => {
    setFilterTouched(false);
    setCategoryFilter("all");
  }, [dayItems]);

  if (gaps.length === 0) return null;

  const handleCategoryChange = (filter: GapCategoryFilter) => {
    setFilterTouched(true);
    setCategoryFilter(filter);
  };

  return (
    <div className={cn("mt-6 space-y-4", className)}>
      <GapCategoryTabs
        activeFilter={categoryFilter}
        onChange={handleCategoryChange}
      />

      {gapRecommendations.map(({ gap, allPlaces, previousCategory }) => {
        const recommendations = applyGapRecommendationFilter(
          allPlaces,
          categoryFilter,
          previousCategory,
        );

        return (
          <Card
            key={`${gap.startTime}-${gap.endTime}`}
            padding="md"
            className="border-dashed border-primary/20 bg-primary/5"
          >
            <Text
              variant="body-medium"
              as="h3"
              className="inline-flex items-center gap-1.5 font-semibold"
            >
              <Hourglass className="h-4 w-4 shrink-0" aria-hidden />
              빈 시간 추천
            </Text>
            <Text variant="muted" className="mt-1">
              {gap.startTime} ~ {gap.endTime} · 빈 시간 {gap.durationLabel}
            </Text>

            {recommendations.length === 0 ? (
              <Text variant="muted" className="mt-3">
                {allPlaces.length === 0
                  ? "근처 KML 장소가 없습니다."
                  : "선택한 카테고리에 추천할 장소가 없습니다."}
              </Text>
            ) : (
              <ul className="mt-3 space-y-2" role="list">
                {recommendations.map((place) => (
                  <li key={place.id}>
                    <PlaceListCard
                      place={place}
                      onOpen={() => onOpenPlace(place, gap)}
                      subtitle={`도보 약 ${place.walkingMinutes}분 · ${place.distanceLabel}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}
