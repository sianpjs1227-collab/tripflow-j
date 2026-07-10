"use client";

import { useEffect, useState } from "react";
import {
  QUICK_SCHEDULE_CATEGORIES,
  getQuickScheduleCategory,
  inferQuickScheduleFromTitle,
  type QuickScheduleCategoryId,
} from "@/lib/quick-schedule";
import { Chip, Text } from "@/components/ui";
import { cn } from "@/lib/cn";

interface QuickScheduleSelectProps {
  title: string;
  onSelectTitle: (title: string) => void;
  onRequestCustomTitle?: () => void;
}

/**
 * 빠른 일정 입력 — 카테고리 Chip → 세부 항목 → title 자동 입력
 */
export default function QuickScheduleSelect({
  title,
  onSelectTitle,
  onRequestCustomTitle,
}: QuickScheduleSelectProps) {
  const inferred = inferQuickScheduleFromTitle(title);
  const [activeCategoryId, setActiveCategoryId] =
    useState<QuickScheduleCategoryId | null>(inferred?.categoryId ?? null);

  useEffect(() => {
    const next = inferQuickScheduleFromTitle(title);
    if (next) {
      setActiveCategoryId(next.categoryId);
    }
  }, [title]);

  const activeCategory = activeCategoryId
    ? getQuickScheduleCategory(activeCategoryId)
    : undefined;

  const handleCategoryClick = (categoryId: QuickScheduleCategoryId) => {
    const category = getQuickScheduleCategory(categoryId);
    if (!category) return;

    if (category.id === "other" || category.items.length === 0) {
      setActiveCategoryId(category.id);
      onRequestCustomTitle?.();
      return;
    }

    setActiveCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  const handleItemClick = (label: string) => {
    onSelectTitle(label);
  };

  return (
    <div className="space-y-3">
      <Text variant="label" as="span">
        빠른 선택
      </Text>

      <div className="flex flex-wrap gap-2">
        {QUICK_SCHEDULE_CATEGORIES.map((category) => {
          const isActive = activeCategoryId === category.id;
          return (
            <Chip
              key={category.id}
              active={isActive}
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                "min-h-11 gap-1.5 px-3.5 text-sm",
                !isActive && "bg-background",
              )}
              aria-pressed={isActive}
            >
              <span aria-hidden>{category.emoji}</span>
              {category.label}
            </Chip>
          );
        })}
      </div>

      {activeCategory && activeCategory.items.length > 0 && (
        <div className="rounded-xl border border-border bg-background px-3 py-3">
          <Text variant="caption" className="mb-2 block">
            {activeCategory.emoji} {activeCategory.label} 세부 선택
          </Text>
          <div className="flex flex-wrap gap-2">
            {activeCategory.items.map((item) => {
              const isSelected =
                inferred?.itemLabel === item &&
                inferred.categoryId === activeCategory.id;
              return (
                <Chip
                  key={item}
                  active={isSelected}
                  onClick={() => handleItemClick(item)}
                  className="min-h-10 px-3.5 text-sm"
                >
                  {item}
                </Chip>
              );
            })}
          </div>
        </div>
      )}

      {activeCategory?.id === "other" && (
        <Text variant="caption">
          아래에서 일정 제목을 직접 입력해 주세요.
        </Text>
      )}
    </div>
  );
}
