"use client";

import type { Place } from "@/types/place";
import {
  formatPlaceRatingStars,
  getPlaceVisitBadgeLabel,
  hasTravelRecordContent,
  isPlaceVisited,
  truncateRecordMemo,
} from "@/lib/place-visit";
import {
  placeCategoryIcons,
  truncateMemo,
} from "@/lib/place-utils";
import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";

interface PlaceListCardProps {
  place: Place;
  onOpen: (place: Place) => void;
  subtitle?: string;
}

/** 장소 리스트 공통 카드 — 탭 시 PlaceActionSheet */
export default function PlaceListCard({
  place,
  onOpen,
  subtitle,
}: PlaceListCardProps) {
  const placeMemo = place.memo ? truncateMemo(place.memo) : undefined;
  const detail = subtitle ?? placeMemo;
  const visitBadge = getPlaceVisitBadgeLabel(place);
  const visited = isPlaceVisited(place);
  const hasRecord = hasTravelRecordContent(place);
  const recordMemo = place.visit?.recordMemo
    ? truncateRecordMemo(place.visit.recordMemo)
    : null;
  const rating = place.visit?.rating;

  return (
    <button
      type="button"
      onClick={() => onOpen(place)}
      className={cn(
        "w-full rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm transition-colors",
        "hover:bg-background active:bg-primary/5",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl leading-none" aria-hidden>
          {placeCategoryIcons[place.category]}
        </span>
        <div className="min-w-0 flex-1">
          <Text variant="body-medium" className="text-base font-semibold">
            {place.name}
          </Text>
          {detail && !recordMemo && (
            <Text variant="muted" className="mt-1">
              {detail}
            </Text>
          )}
          {hasRecord && (
            <div className="mt-2 space-y-1.5">
              {visited && visitBadge && (
                <div className="inline-flex flex-col rounded-xl bg-success/10 px-2.5 py-1.5">
                  <Text variant="caption" className="font-semibold text-success">
                    ✅ 방문
                  </Text>
                  <Text variant="caption" className="mt-0.5 text-success/80">
                    {visitBadge}
                  </Text>
                </div>
              )}
              {rating != null && (
                <Text variant="caption" className="block text-warning">
                  {formatPlaceRatingStars(rating)}{" "}
                  <span className="text-muted">({rating})</span>
                </Text>
              )}
              {recordMemo && (
                <Text variant="muted" className="line-clamp-2 text-sm">
                  {recordMemo}
                </Text>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
