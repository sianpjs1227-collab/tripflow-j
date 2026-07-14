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
    <Card padding="none" className="px-2.5 py-2 sm:py-1.5">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary sm:h-6 sm:w-6">
            <Calendar className="h-3.5 w-3.5 sm:h-3 sm:w-3" aria-hidden />
          </span>
          <div className="min-w-0">
            <Text
              variant="caption"
              className="block text-[11px] leading-none sm:text-[10px]"
            >
              일정
            </Text>
            <p className="truncate text-[12.5px] font-bold leading-tight text-foreground sm:text-[11px]">
              {scheduleCount}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary sm:h-6 sm:w-6">
            <Wallet className="h-3.5 w-3.5 sm:h-3 sm:w-3" aria-hidden />
          </span>
          <div className="min-w-0">
            <Text
              variant="caption"
              className="block text-[11px] leading-none sm:text-[10px]"
            >
              지출
            </Text>
            <p className="truncate text-[12.5px] font-bold leading-tight text-foreground sm:text-[11px]">
              {expenseLabel}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
