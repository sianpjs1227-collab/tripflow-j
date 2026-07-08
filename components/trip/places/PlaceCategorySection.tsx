"use client";

import { useState } from "react";
import type { Place, PlaceCategory } from "@/types/place";
import {
  placeCategoryIcons,
  placeCategoryLabels,
} from "@/lib/place-utils";
import { PlaceCard } from "./PlaceDetailModal";

interface PlaceCategorySectionProps {
  category: PlaceCategory;
  places: Place[];
  onPlaceClick: (place: Place) => void;
}

/** 카테고리별 접기/펼치기 장소 목록 */
export default function PlaceCategorySection({
  category,
  places,
  onPlaceClick,
}: PlaceCategorySectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const icon = placeCategoryIcons[category];
  const label = placeCategoryLabels[category];

  return (
    <section className="border-b border-[#ebebeb] pb-4 last:border-b-0 dark:border-white/10">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
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
        <ul className="mt-2 space-y-2" role="list">
          {places.map((place) => (
            <li key={place.id}>
              <PlaceCard place={place} onClick={() => onPlaceClick(place)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
