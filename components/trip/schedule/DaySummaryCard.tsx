import { Calendar, MapPin, Star, Wallet } from "lucide-react";
import { Card, Text } from "@/components/ui";

interface DaySummaryCardProps {
  scheduleCount: number;
  placeCount: number;
  expenseLabel: string;
  favoriteCount: number;
}

const stats = [
  { key: "schedule", icon: Calendar, label: "일정" },
  { key: "places", icon: MapPin, label: "장소" },
  { key: "expense", icon: Wallet, label: "지출" },
  { key: "favorites", icon: Star, label: "즐겨찾기" },
] as const;

/** Day 선택 아래 요약 통계 카드 */
export default function DaySummaryCard({
  scheduleCount,
  placeCount,
  expenseLabel,
  favoriteCount,
}: DaySummaryCardProps) {
  const values: Record<(typeof stats)[number]["key"], string> = {
    schedule: String(scheduleCount),
    places: String(placeCount),
    expense: expenseLabel,
    favorites: String(favoriteCount),
  };

  return (
    <Card padding="sm" className="transition-shadow duration-200 hover:shadow-md">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ key, icon: Icon, label }) => (
          <div key={key} className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <Text variant="caption" className="block text-[11px]">
                {label}
              </Text>
              <p className="truncate text-base font-bold leading-tight text-foreground">
                {values[key]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
