"use client";

import { useMemo, useState } from "react";
import type { Place } from "@/types/place";
import { getPlaceCoordinates, type GeoPosition } from "@/lib/directions";
import {
  groupNearbyPlacesByCategory,
  getNearbyPlaces,
  nearbyRadiusOptions,
  type NearbyRadiusOption,
} from "@/lib/nearby-utils";
import NearbyCategorySection from "./NearbyCategorySection";

interface NearbyPlacesResultsProps {
  places: Place[];
  userPosition: GeoPosition;
  onClose: () => void;
}

/** 내 주변 결과 전용 화면 */
export default function NearbyPlacesResults({
  places,
  userPosition,
  onClose,
}: NearbyPlacesResultsProps) {
  const [radius, setRadius] = useState<NearbyRadiusOption>(500);

  const placesWithCoords = useMemo(
    () => places.filter((place) => getPlaceCoordinates(place) != null),
    [places],
  );

  const groupedNearby = useMemo(() => {
    const nearby = getNearbyPlaces(places, userPosition, radius);
    return groupNearbyPlacesByCategory(nearby);
  }, [places, userPosition, radius]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#111111] dark:text-white">
          내 주변 결과
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-sm font-medium text-[#0A84FF] hover:underline"
        >
          닫기
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {nearbyRadiusOptions.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => setRadius(option.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              radius === option.value
                ? "bg-[#0A84FF] text-white"
                : "border border-[#ebebeb] bg-white text-[#111111] dark:border-white/20 dark:bg-white/[0.05] dark:text-white"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {placesWithCoords.length === 0 ? (
        <p className="mt-6 text-sm text-[#6e6e73]">
          좌표가 있는 장소가 없습니다. KML 가져오기로 장소를 추가해주세요.
        </p>
      ) : groupedNearby.length === 0 ? (
        <p className="mt-6 text-sm text-[#6e6e73]">
          선택한 반경 안에 장소가 없습니다.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {groupedNearby.map((group) => (
            <NearbyCategorySection
              key={group.category}
              category={group.category}
              places={group.places}
              userPosition={userPosition}
            />
          ))}
        </div>
      )}
    </div>
  );
}
