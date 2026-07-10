"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Place, PlaceCategory } from "@/types/place";
import {
  placeCategoryIcons,
  placeCategoryLabels,
} from "@/lib/place-utils";
import { Text } from "@/components/ui";
import PlaceListCard from "./PlaceListCard";

interface PlaceCategorySectionProps {
  category: PlaceCategory;
  places: Place[];
  onOpenPlace: (place: Place) => void;
  defaultOpen?: boolean;
}

/** 카테고리별 접기/펼치기 장소 목록 */
export default function PlaceCategorySection({
  category,
  places,
  onOpenPlace,
  defaultOpen = false,
}: PlaceCategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const icon = placeCategoryIcons[category];
  const label = placeCategoryLabels[category];

  return (
    <section className="border-b border-border pb-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between py-2 text-left"
        aria-expanded={isOpen}
      >
        <Text
          variant="body-medium"
          as="span"
          className="text-[13px] font-semibold"
        >
          {icon} {label}{" "}
          <Text
            variant="caption"
            as="span"
            className="text-[11px] font-normal"
          >
            ({places.length})
          </Text>
        </Text>
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
        )}
      </button>

      {isOpen && (
        <ul className="mt-1.5 space-y-1.5" role="list">
          {places.map((place) => (
            <li key={place.id}>
              <PlaceListCard place={place} onOpen={onOpenPlace} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
