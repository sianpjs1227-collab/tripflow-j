"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Trip } from "@/types/trip";
import { cn } from "@/lib/cn";
import HeroCarouselCard from "./HeroCarouselCard";

interface HomeHeroCarouselProps {
  trips: Trip[];
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
}

/** 홈 Hero Carousel — 가로 스와이프 + 페이지 인디케이터 */
export default function HomeHeroCarousel({
  trips,
  onEdit,
  onDelete,
}: HomeHeroCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = useCallback(() => {
    const container = scrollRef.current;
    if (!container || trips.length === 0) return;

    const slideWidth = container.clientWidth;
    if (slideWidth <= 0) return;

    const index = Math.round(container.scrollLeft / slideWidth);
    setActiveIndex(Math.min(Math.max(index, 0), trips.length - 1));
  }, [trips.length]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    container.addEventListener("scroll", updateActiveIndex, { passive: true });
    window.addEventListener("resize", updateActiveIndex);

    return () => {
      container.removeEventListener("scroll", updateActiveIndex);
      window.removeEventListener("resize", updateActiveIndex);
    };
  }, [updateActiveIndex]);

  useEffect(() => {
    setActiveIndex(0);
    scrollRef.current?.scrollTo({ left: 0, behavior: "auto" });
  }, [trips]);

  if (trips.length === 0) return null;

  return (
    <section
      className="animate-fade-in-up animation-delay-100"
      aria-label="여행 Hero Carousel"
    >
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="w-full shrink-0 snap-center"
          >
            <HeroCarouselCard
              trip={trip}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>

      {trips.length > 1 && (
        <div
          className="mt-4 flex items-center justify-center gap-2"
          role="tablist"
          aria-label="Carousel 페이지"
        >
          {trips.map((trip, index) => (
            <button
              key={trip.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`${index + 1}번째 여행`}
              onClick={() => {
                const container = scrollRef.current;
                if (!container) return;
                container.scrollTo({
                  left: container.clientWidth * index,
                  behavior: "smooth",
                });
                setActiveIndex(index);
              }}
              className={cn(
                "rounded-full transition-all duration-300",
                index === activeIndex
                  ? "h-2.5 w-2.5 bg-primary shadow-sm"
                  : "h-2 w-2 bg-border hover:bg-muted",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
