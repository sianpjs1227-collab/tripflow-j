"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Place, PlaceCategory } from "@/types/place";
import type { NearbyPlace } from "@/lib/nearby-utils";
import { formatDistanceMeters } from "@/lib/nearby-utils";
import {
  placeCategoryIcons,
  placeCategoryLabels,
} from "@/lib/place-utils";
import { Button, Text } from "@/components/ui";
import PlaceListCard from "./PlaceListCard";
import type { GeoPosition } from "@/lib/directions";

const INITIAL_VISIBLE_COUNT = 10;

interface NearbyCategorySectionProps {
  category: PlaceCategory;
  places: NearbyPlace[];
  onOpenPlace: (place: Place) => void;
  defaultOpen?: boolean;
}

/** 내 주변 결과 — 카테고리별 접기/펼치기 */
export default function NearbyCategorySection({
  category,
  places,
  onOpenPlace,
  defaultOpen = false,
}: NearbyCategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  useEffect(() => {
    if (defaultOpen) setIsOpen(true);
  }, [defaultOpen]);

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
    <section className="border-b border-border pb-4 last:border-b-0">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between py-2 text-left"
        aria-expanded={isOpen}
      >
        <Text variant="body-medium" as="span" className="text-base font-semibold">
          {icon} {label}{" "}
          <Text variant="muted" as="span" className="text-sm font-normal">
            ({places.length})
          </Text>
        </Text>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        )}
      </button>

      {isOpen && (
        <>
          <ul className="mt-2 space-y-2" role="list">
            {visiblePlaces.map((place) => (
              <li key={place.id}>
                <PlaceListCard
                  place={place}
                  onOpen={onOpenPlace}
                  subtitle={`도보 약 ${place.walkingMinutes}분 · ${formatDistanceMeters(place.distanceMeters)}`}
                />
              </li>
            ))}
          </ul>

          {hasMore && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setVisibleCount(places.length)}
              className="mt-3 w-full text-primary"
            >
              더 보기
            </Button>
          )}
        </>
      )}
    </section>
  );
}
