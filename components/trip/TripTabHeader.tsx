"use client";

import { Plus } from "lucide-react";
import { Button, Text } from "@/components/ui";
import { cn } from "@/lib/cn";

interface TripTabHeaderProps {
  title: string;
  meta?: string;
  onAdd?: () => void;
  addLabel?: string;
  className?: string;
}

/** 탭 공통 헤더 — 제목 + ＋ 추가 */
export default function TripTabHeader({
  title,
  meta,
  onAdd,
  addLabel = "추가",
  className,
}: TripTabHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <div className="min-w-0">
        <Text
          variant="title-sm"
          as="h2"
          className="text-lg font-bold sm:text-base"
        >
          {title}
        </Text>
        {meta ? (
          <Text
            variant="caption"
            className="mt-0.5 block text-[12.5px] sm:text-[11px]"
          >
            {meta}
          </Text>
        ) : null}
      </div>
      {onAdd && (
        <Button
          type="button"
          onClick={onAdd}
          size="sm"
          className="h-9 shrink-0 px-2.5 text-[12.5px] sm:h-8 sm:text-[11px]"
        >
          <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden />
          {addLabel}
        </Button>
      )}
    </div>
  );
}
