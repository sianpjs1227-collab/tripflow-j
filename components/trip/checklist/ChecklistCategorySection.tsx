"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ChecklistItem } from "@/types/checklist";
import type { ChecklistGroupLabel } from "@/lib/default-checklist";
import { Button, Card, Text } from "@/components/ui";
import { cn } from "@/lib/cn";

interface ChecklistCategorySectionProps {
  category: ChecklistGroupLabel;
  items: ChecklistItem[];
  defaultOpen?: boolean;
  onToggle: (id: string) => void;
  onEdit: (item: ChecklistItem) => void;
  onDelete: (id: string) => void;
}

/** 카테고리별 접기/펼치기 체크리스트 */
export default function ChecklistCategorySection({
  category,
  items,
  defaultOpen = true,
  onToggle,
  onEdit,
  onDelete,
}: ChecklistCategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const checkedCount = items.filter((item) => item.checked).length;

  return (
    <section className="border-b border-border pb-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between py-2 text-left"
        aria-expanded={isOpen}
      >
        <Text
          variant="body-medium"
          as="span"
          className="text-[13px] font-semibold"
        >
          {category}{" "}
          <Text
            variant="caption"
            as="span"
            className="text-[11px] font-normal"
          >
            ({checkedCount}/{items.length})
          </Text>
        </Text>
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
        )}
      </button>

      {isOpen && (
        <ul className="mt-1.5 space-y-1.5" role="list">
          {items.map((item) => (
            <li key={item.id}>
              <Card padding="none" className="px-2.5 py-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => onToggle(item.id)}
                    className="h-4 w-4 shrink-0 rounded border-border accent-primary"
                    aria-label={`${item.text} 체크`}
                  />

                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className={cn(
                      "min-w-0 flex-1 text-left text-[13px] font-medium leading-snug",
                      item.checked
                        ? "text-muted line-through"
                        : "text-foreground",
                    )}
                  >
                    {item.text}
                  </button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!confirm("이 항목을 삭제할까요?")) return;
                      onDelete(item.id);
                    }}
                    className="h-7 shrink-0 px-1.5 text-[11px] text-muted hover:text-danger"
                  >
                    삭제
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
