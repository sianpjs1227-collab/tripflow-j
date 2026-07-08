"use client";

import { useState } from "react";
import type { PlaceCategory } from "@/types/place";
import type { NearbyPlace } from "@/lib/nearby-utils";
import {
  placeCategoryIcons,
  placeCategoryLabels,
} from "@/lib/place-utils";
import NearbyPlaceCard from "./NearbyPlaceCard";
import type { GeoPosition } from "@/lib/directions";

const INITIAL_VISIBLE_COUNT = 10;

interface NearbyCategorySectionProps {
  category: PlaceCategory;
  places: NearbyPlace[];
  userPosition: GeoPosition;
}

/** 내 주변 결과 — 카테고리별 접기/펼치기 (기본 접힘, 최대 10개 + 더 보기) */
export default function NearbyCategorySection({
  category,
  places,
  userPosition,
}: NearbyCategorySectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const icon = placeCategoryIcons[category];
  const label = placeCategoryLabels[category];
  const visiblePlaces = places.slice(0, visibleCount);
  const hasMore = places.length > visibleCount;

  const handleToggle = () => {
    setIsOpen((prev) => {
      if (prev) setVisibleCount(INITIAL_VISIBLE_COUNT);
      return !prev;
    });
  };

  return (
    <section className="border-b border-[#ebebeb] pb-4 last:border-b-0 dark:border-white/10">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between py-2 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-base font-semibold text-[#111111] dark:text-white">
          {icon} {label}{" "}
          <span className="text-sm font-normal text-[#6e6e73]">
            ({places.length})
          </span>
        </span>
        <span className="text-sm text-[#6e6e73]" aria-hidden>
          {isOpen ? "▼" : "▶"}
        </span>
      </button>

      {isOpen && (
        <>
          <ul className="mt-2 space-y-2" role="list">
            {visiblePlaces.map((place) => (
              <li key={place.id}>
                <NearbyPlaceCard place={place} userPosition={userPosition} />
              </li>
            ))}
          </ul>

          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount(places.length)}
              className="mt-3 w-full rounded-xl border border-[#ebebeb] py-2.5 text-sm font-medium text-[#0A84FF] dark:border-white/20"
            >
              더 보기
            </button>
          )}
        </>
      )}
    </section>
  );
}
