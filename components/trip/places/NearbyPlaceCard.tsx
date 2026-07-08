"use client";

import type { NearbyPlace } from "@/lib/nearby-utils";
import { formatDistanceMeters } from "@/lib/nearby-utils";
import { openDirectionsToPlace, type GeoPosition } from "@/lib/directions";

interface NearbyPlaceCardProps {
  place: NearbyPlace;
  userPosition: GeoPosition;
}

export default function NearbyPlaceCard({
  place,
  userPosition,
}: NearbyPlaceCardProps) {
  return (
    <div className="rounded-xl border border-[#ebebeb] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.05]">
      <p className="text-base font-semibold text-[#111111] dark:text-white">
        {place.name}
      </p>

      <p className="mt-1 text-sm text-[#6e6e73]">
        도보 약 {place.walkingMinutes}분 · {formatDistanceMeters(place.distanceMeters)}
      </p>

      <button
        type="button"
        onClick={() => {
          void openDirectionsToPlace(place, userPosition);
        }}
        className="mt-2 text-sm font-medium text-[#0A84FF] hover:underline"
      >
        🧭 길찾기
      </button>
    </div>
  );
}
