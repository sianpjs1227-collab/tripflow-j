import { Map } from "lucide-react";
import type { PlaceCategory } from "@/types/place";
import type { ScheduleItem } from "@/types/schedule";
import { placeCategoryIcons, placeCategoryLabels } from "@/lib/place-utils";
import { inferQuickScheduleFromTitle } from "@/lib/quick-schedule";
import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";

const categoryAccentBorder: Record<PlaceCategory, string> = {
  accommodation: "border-l-blue-500",
  restaurant_bar: "border-l-orange-500",
  cafe_dessert: "border-l-green-500",
  shopping: "border-l-purple-500",
  sightseeing: "border-l-red-500",
  other: "border-l-border",
};

const categoryAccentBg: Record<PlaceCategory, string> = {
  accommodation: "bg-blue-50/90",
  restaurant_bar: "bg-orange-50/90",
  cafe_dessert: "bg-green-50/90",
  shopping: "bg-purple-50/90",
  sightseeing: "bg-red-50/90",
  other: "bg-card",
};

interface ScheduleItemCardProps {
  item: ScheduleItem;
  category?: PlaceCategory;
  isLast?: boolean;
  onEdit: () => void;
  onOpenPlace: () => void;
}

function getPlaceActionLabel(item: ScheduleItem): string {
  const hasCoords =
    item.latitude != null &&
    item.longitude != null &&
    !Number.isNaN(item.latitude) &&
    !Number.isNaN(item.longitude);

  return hasCoords ? "미니맵 보기" : "길찾기";
}

/** 일정 카드 — 좌(70%) 일정 수정 · 우(30%) 장소/지도 */
export default function ScheduleItemCard({
  item,
  category = "other",
  isLast = false,
  onEdit,
  onOpenPlace,
}: ScheduleItemCardProps) {
  const hasPlace = item.placeName.trim().length > 0;
  const quickMatch = inferQuickScheduleFromTitle(item.title);
  const titleEmoji = quickMatch?.emoji ?? placeCategoryIcons[category];
  const showEventTitle =
    item.title.trim().length > 0 &&
    item.title.trim() !== item.placeName.trim() &&
    item.title.trim() !== placeCategoryLabels[category];
  const showFallbackTitle = !showEventTitle && !hasPlace;

  const timeLabel = item.endTime
    ? `${item.time}–${item.endTime}`
    : item.time;

  const placeActionLabel = getPlaceActionLabel(item);

  return (
    <li className={cn(!isLast && "mb-1.5")}>
      <div
        className={cn(
          "flex gap-1.5 overflow-hidden rounded-xl border border-border border-l-[3px] p-1.5 shadow-sm",
          categoryAccentBorder[category],
          categoryAccentBg[category],
        )}
      >
        <button
          type="button"
          onClick={onEdit}
          aria-label="일정 수정"
          className={cn(
            "flex min-h-[4.75rem] min-w-0 flex-col justify-center rounded-lg px-2.5 py-2 text-left",
            "transition-colors hover:bg-black/[0.04] active:bg-black/[0.08]",
            hasPlace ? "flex-[7]" : "flex-1",
          )}
        >
          <div className="flex items-center gap-1 text-[15px] font-medium leading-none text-muted">
            <span aria-hidden>🕙</span>
            <time>{timeLabel}</time>
          </div>

          {showEventTitle && (
            <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">
              <span aria-hidden>{titleEmoji} </span>
              {item.title}
            </p>
          )}

          {showFallbackTitle && (
            <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">
              <span aria-hidden>{titleEmoji} </span>
              {item.title.trim() || "일정"}
            </p>
          )}

          {hasPlace && (
            <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-snug text-muted">
              <span aria-hidden>📍 </span>
              {item.placeName}
            </p>
          )}

          {item.memo && (
            <Text
              variant="muted"
              className="mt-1 line-clamp-2 text-[11px] leading-snug"
            >
              {item.memo}
            </Text>
          )}
        </button>

        {hasPlace && (
          <button
            type="button"
            onClick={onOpenPlace}
            aria-label={`${item.placeName} ${placeActionLabel}`}
            className={cn(
              "flex min-h-[4.75rem] min-w-0 flex-[3] flex-col items-center justify-center gap-1",
              "rounded-lg border border-border/80 bg-background/95 px-2 py-2 text-center shadow-sm",
              "transition-colors hover:bg-background active:bg-primary/10",
            )}
          >
            <Map className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="line-clamp-2 w-full text-[11px] font-semibold leading-tight text-foreground">
              {item.placeName}
            </span>
            <span className="text-[10px] font-medium text-primary">
              {placeActionLabel}
            </span>
          </button>
        )}
      </div>
    </li>
  );
}
