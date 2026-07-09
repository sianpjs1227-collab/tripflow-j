"use client";

import type { Trip } from "@/types/trip";
import { resolveTripCoverSrc } from "@/lib/trip-default-covers";
import { cn } from "@/lib/cn";

interface TripCoverProps {
  trip: Trip;
  className?: string;
  overlay?: boolean;
  size?: "card" | "hero";
  /** Carousel 등 — 부모 높이에 맞춰 채움 */
  fill?: boolean;
}

/** 여행 커버 — 사용자 사진 / 국가 기본 이미지 */
export default function TripCover({
  trip,
  className,
  overlay = true,
  size = "card",
  fill = false,
}: TripCoverProps) {
  const coverSrc = resolveTripCoverSrc(trip);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-background",
        !fill && (size === "hero" ? "aspect-[16/9]" : "aspect-[16/10]"),
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverSrc}
        alt=""
        className="h-full w-full object-cover"
      />

      {overlay && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
      )}
    </div>
  );
}
