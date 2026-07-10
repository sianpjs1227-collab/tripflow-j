import type { PlaceCategory } from "@/types/place";
import type { ScheduleItem } from "@/types/schedule";
import { placeCategoryLabels } from "@/lib/place-utils";
import { inferQuickScheduleFromTitle } from "@/lib/quick-schedule";
import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";

/** 카드 Badge용 짧은 라벨 */
export const scheduleCategoryBadgeLabels: Record<PlaceCategory, string> = {
  accommodation: "숙소",
  restaurant_bar: "식당",
  cafe_dessert: "카페",
  shopping: "쇼핑",
  sightseeing: "관광",
  other: "기타",
};

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

const categoryBadgeStyles: Record<PlaceCategory, string> = {
  accommodation: "bg-blue-100 text-blue-700",
  restaurant_bar: "bg-orange-100 text-orange-700",
  cafe_dessert: "bg-green-100 text-green-700",
  shopping: "bg-purple-100 text-purple-700",
  sightseeing: "bg-red-100 text-red-700",
  other: "bg-muted/15 text-muted",
};

interface ScheduleItemCardProps {
  item: ScheduleItem;
  category?: PlaceCategory;
  isLast?: boolean;
  onEdit: () => void;
  onOpenPlace: () => void;
}

/** 일정 Timeline 카드 */
export default function ScheduleItemCard({
  item,
  category = "other",
  isLast = false,
  onEdit,
  onOpenPlace,
}: ScheduleItemCardProps) {
  const hasPlace = item.placeName.trim().length > 0;
  const primaryTitle = hasPlace ? item.placeName : item.title;
  const quickMatch = inferQuickScheduleFromTitle(item.title);
  const showEventTitle =
    hasPlace &&
    item.title.trim().length > 0 &&
    item.title.trim() !== item.placeName.trim() &&
    item.title.trim() !== placeCategoryLabels[category];

  return (
    <li className="flex gap-2.5">
      <div className="flex w-12 shrink-0 flex-col items-end">
        <time className="text-base font-bold leading-none tracking-tight text-foreground">
          {item.time}
        </time>
        {item.endTime && (
          <Text variant="caption" className="mt-1 text-[10px] leading-none">
            ~{item.endTime}
          </Text>
        )}
        {!isLast && (
          <div className="mt-1.5 min-h-3 w-px flex-1 bg-border" aria-hidden />
        )}
      </div>

      <div
        className={cn(
          "mb-1.5 flex-1 overflow-hidden rounded-2xl border border-border border-l-[3px] bg-card shadow-sm transition-all duration-200 hover:shadow-md",
          categoryAccentBorder[category],
          categoryAccentBg[category],
          isLast && "mb-0",
        )}
      >
        {hasPlace ? (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="flex w-full flex-wrap items-center gap-1.5 px-3 pt-2.5 text-left"
            >
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none",
                  categoryBadgeStyles[category],
                )}
              >
                {scheduleCategoryBadgeLabels[category]}
              </span>
              {showEventTitle && (
                <Text variant="caption" className="text-[11px] font-medium">
                  {quickMatch ? (
                    <>
                      <span aria-hidden>{quickMatch.emoji} </span>
                      {item.title}
                    </>
                  ) : (
                    item.title
                  )}
                </Text>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenPlace}
              className="block w-full px-3 pb-1 text-left"
            >
              <p className="text-[17px] font-bold leading-snug text-foreground">
                {quickMatch && !showEventTitle ? (
                  <>
                    <span aria-hidden>{quickMatch.emoji} </span>
                    {primaryTitle}
                  </>
                ) : (
                  primaryTitle
                )}
              </p>
            </button>

            {item.memo && (
              <button
                type="button"
                onClick={onEdit}
                className="block w-full px-3 pb-2.5 pt-0 text-left"
              >
                <Text
                  variant="muted"
                  className="line-clamp-2 text-[11px] leading-relaxed"
                >
                  {item.memo}
                </Text>
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="w-full px-3 py-2.5 text-left"
          >
            <p className="text-[17px] font-bold leading-snug text-foreground">
              {quickMatch ? (
                <>
                  <span aria-hidden>{quickMatch.emoji} </span>
                  {primaryTitle}
                </>
              ) : (
                primaryTitle
              )}
            </p>
            {item.memo && (
              <Text
                variant="muted"
                className="mt-1 line-clamp-2 text-[11px] leading-relaxed"
              >
                {item.memo}
              </Text>
            )}
          </button>
        )}
      </div>
    </li>
  );
}
