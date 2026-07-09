"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Trip } from "@/types/trip";
import { Text } from "@/components/ui";
import TripCard from "./TripCard";

interface TripListSectionProps {
  title: string;
  headingId: string;
  trips: Trip[];
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
  animationDelayClass?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

/** 여행 카드 목록 섹션 — 접기/펼치기 지원 */
export default function TripListSection({
  title,
  headingId,
  trips,
  onEdit,
  onDelete,
  animationDelayClass = "animation-delay-200",
  collapsible = false,
  defaultOpen = true,
}: TripListSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (trips.length === 0) return null;

  const heading = (
    <>
      <Text variant="body-medium" as="span" className="text-lg font-semibold">
        {title}
      </Text>
      <Text variant="muted" className="text-sm">
        {trips.length}개
      </Text>
    </>
  );

  return (
    <section
      className={`animate-fade-in-up ${animationDelayClass}`}
      aria-labelledby={headingId}
    >
      {collapsible ? (
        <button
          type="button"
          id={headingId}
          onClick={() => setIsOpen((prev) => !prev)}
          className="mb-4 flex w-full items-center justify-between py-1 text-left"
          aria-expanded={isOpen}
        >
          <span className="flex items-baseline gap-2">{heading}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          )}
        </button>
      ) : (
        <div
          id={headingId}
          className="mb-4 flex items-baseline justify-between"
        >
          <Text variant="body-medium" as="h2" className="text-lg font-semibold">
            {title}
          </Text>
          <Text variant="muted" className="text-sm">
            {trips.length}개
          </Text>
        </div>
      )}

      {(!collapsible || isOpen) && (
        <ul
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2"
          role="list"
        >
          {trips.map((trip, index) => (
            <li key={trip.id}>
              <TripCard
                trip={trip}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
