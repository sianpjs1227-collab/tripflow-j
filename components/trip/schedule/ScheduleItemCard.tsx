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

/** 일정 카드 — 시간·제목·장소를 한 카드 안에 배치 */
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

  const timeLabel = item.endTime
    ? `${item.time}–${item.endTime}`
    : item.time;

  return (
    <li className={cn(!isLast && "mb-1.5")}>
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border border-l-[3px] bg-card shadow-sm transition-shadow duration-200 hover:shadow-md",
          categoryAccentBorder[category],
          categoryAccentBg[category],
        )}
      >
        <div className="px-2.5 py-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex w-full items-center gap-1 text-left text-[15px] font-medium leading-none text-muted"
          >
            <span aria-hidden>🕙</span>
            <time>{timeLabel}</time>
          </button>

          {showEventTitle && (
            <button
              type="button"
              onClick={onEdit}
              className="mt-1.5 block w-full text-left text-[13px] font-semibold leading-snug text-foreground"
            >
              <span aria-hidden>{titleEmoji} </span>
              {item.title}
            </button>
          )}

          {hasPlace ? (
            <button
              type="button"
              onClick={onOpenPlace}
              className={cn(
                "block w-full text-left leading-snug",
                showEventTitle
                  ? "mt-0.5 text-[12px] font-medium text-muted"
                  : "mt-1.5 text-[13px] font-semibold text-foreground",
              )}
            >
              <span aria-hidden>📍 </span>
              {item.placeName}
            </button>
          ) : (
            !showEventTitle && (
              <button
                type="button"
                onClick={onEdit}
                className="mt-1.5 block w-full text-left text-[13px] font-semibold leading-snug text-foreground"
              >
                <span aria-hidden>{titleEmoji} </span>
                {item.title || "일정"}
              </button>
            )
          )}

          {item.memo && (
            <button
              type="button"
              onClick={onEdit}
              className="mt-1 block w-full text-left"
            >
              <Text
                variant="muted"
                className="line-clamp-1 text-[11px] leading-snug"
              >
                {item.memo}
              </Text>
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
