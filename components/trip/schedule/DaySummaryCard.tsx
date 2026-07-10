import { Calendar, Wallet } from "lucide-react";
import { Card, Text } from "@/components/ui";

interface DaySummaryCardProps {
  scheduleCount: number;
  expenseLabel: string;
}

/** Day 선택 아래 요약 통계 — 일정·지출만 */
export default function DaySummaryCard({
  scheduleCount,
  expenseLabel,
}: DaySummaryCardProps) {
  return (
    <Card padding="none" className="px-2.5 py-1.5">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Calendar className="h-3 w-3" aria-hidden />
          </span>
          <div className="min-w-0">
            <Text variant="caption" className="block text-[10px] leading-none">
              일정
            </Text>
            <p className="truncate text-[11px] font-bold leading-tight text-foreground">
              {scheduleCount}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Wallet className="h-3 w-3" aria-hidden />
          </span>
          <div className="min-w-0">
            <Text variant="caption" className="block text-[10px] leading-none">
              지출
            </Text>
            <p className="truncate text-[11px] font-bold leading-tight text-foreground">
              {expenseLabel}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
