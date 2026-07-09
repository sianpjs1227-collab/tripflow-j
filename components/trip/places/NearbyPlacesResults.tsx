"use client";

import { useMemo, useState } from "react";
import type { Place } from "@/types/place";
import type { GeoPosition } from "@/lib/directions";
import {
  groupNearbyPlacesByCategory,
  getNearbyPlaces,
  nearbyRadiusOptions,
  type NearbyPlace,
  type NearbyRadiusOption,
} from "@/lib/nearby-utils";
import { Chip, Text } from "@/components/ui";
import NearbyCategorySection from "./NearbyCategorySection";

interface NearbyPlacesResultsProps {
  /** 카테고리 필터가 적용된 장소 목록 */
  places: Place[];
  searchQuery: string;
  userPosition: GeoPosition;
  onOpenPlace: (place: Place) => void;
}

/** 내 주변 결과 — 동일 places 데이터, 카테고리·검색 필터 적용 */
export default function NearbyPlacesResults({
  places,
  searchQuery,
  userPosition,
  onOpenPlace,
}: NearbyPlacesResultsProps) {
  const [radius, setRadius] = useState<NearbyRadiusOption>(500);
  const isSearching = searchQuery.trim().length > 0;

  const groupedNearby = useMemo(() => {
    const nearby = getNearbyPlaces(places, userPosition, radius);
    const trimmed = searchQuery.trim().toLowerCase();
    const searched: NearbyPlace[] = trimmed
      ? nearby.filter((place) =>
          place.name.toLowerCase().includes(trimmed),
        )
      : nearby;
    return groupNearbyPlacesByCategory(searched);
  }, [places, userPosition, radius, searchQuery]);

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {nearbyRadiusOptions.map((option) => (
          <Chip
            key={option.label}
            active={radius === option.value}
            onClick={() => setRadius(option.value)}
          >
            {option.label}
          </Chip>
        ))}
      </div>

      {places.length === 0 ? (
        <Text variant="muted" className="mt-6">
          선택한 카테고리에 좌표가 있는 장소가 없습니다.
        </Text>
      ) : groupedNearby.length === 0 ? (
        <Text variant="muted" className="mt-6 text-center">
          {isSearching
            ? "검색 결과가 없습니다."
            : "선택한 반경 안에 장소가 없습니다."}
        </Text>
      ) : (
        <div className="mt-6 space-y-4">
          {groupedNearby.map((group) => (
            <NearbyCategorySection
              key={group.category}
              category={group.category}
              places={group.places}
              onOpenPlace={onOpenPlace}
              defaultOpen={isSearching}
            />
          ))}
        </div>
      )}
    </div>
  );
}
