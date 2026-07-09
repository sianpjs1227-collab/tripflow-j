"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChecklistItem } from "@/types/checklist";
import {
  CHECKLIST_CATEGORY_ORDER,
  type DefaultChecklistEntry,
} from "@/lib/default-checklist";
import { getUnusedDefaultChecklistEntries } from "@/lib/checklist-utils";
import { Button, Card, OverlayLayer, Text } from "@/components/ui";
import { cn } from "@/lib/cn";

interface ChecklistDefaultPickerModalProps {
  isOpen: boolean;
  existingItems: ChecklistItem[];
  onClose: () => void;
  onAdd: (entries: DefaultChecklistEntry[]) => void;
}

function entryKey(entry: DefaultChecklistEntry): string {
  return `${entry.category}:${entry.text}`;
}

/** 아직 추가되지 않은 기본 항목 선택 */
export default function ChecklistDefaultPickerModal({
  isOpen,
  existingItems,
  onClose,
  onAdd,
}: ChecklistDefaultPickerModalProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const unusedEntries = useMemo(
    () => getUnusedDefaultChecklistEntries(existingItems),
    [existingItems],
  );

  const groupedEntries = useMemo(() => {
    return CHECKLIST_CATEGORY_ORDER.map((category) => ({
      category,
      entries: unusedEntries.filter((entry) => entry.category === category),
    })).filter((group) => group.entries.length > 0);
  }, [unusedEntries]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedKeys(new Set());
  }, [isOpen]);

  const toggleEntry = (entry: DefaultChecklistEntry) => {
    const key = entryKey(entry);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleAdd = () => {
    const selected = unusedEntries.filter((entry) =>
      selectedKeys.has(entryKey(entry)),
    );
    if (selected.length === 0) return;
    onAdd(selected);
    onClose();
  };

  const handleClose = () => {
    setSelectedKeys(new Set());
    onClose();
  };

  return (
    <OverlayLayer
      isOpen={isOpen}
      sheet
      onClose={handleClose}
      closeLabel="모달 닫기"
    >
      <Text variant="title-sm" as="h2" className="text-xl font-bold">
        기본 항목에서 추가
      </Text>
      <Text variant="muted" className="mt-2">
        추가할 항목을 선택하세요.
      </Text>

      {groupedEntries.length === 0 ? (
        <Text variant="muted" className="mt-6">
          추가할 수 있는 기본 항목이 없습니다.
        </Text>
      ) : (
        <div className="mt-4 max-h-[50vh] space-y-4 overflow-y-auto">
          {groupedEntries.map((group) => (
            <section key={group.category}>
              <Text variant="label" className="mb-2 block">
                {group.category}
              </Text>
              <ul className="space-y-2" role="list">
                {group.entries.map((entry) => {
                  const key = entryKey(entry);
                  const isSelected = selectedKeys.has(key);

                  return (
                    <li key={key}>
                      <Card
                        padding="sm"
                        className={cn(
                          "cursor-pointer transition-colors",
                          isSelected && "border-primary bg-primary/5",
                        )}
                        onClick={() => toggleEntry(entry)}
                      >
                        <label className="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleEntry(entry)}
                            className="h-5 w-5 shrink-0 rounded border-border accent-primary"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Text variant="body" as="span">
                            {entry.text}
                          </Text>
                        </label>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          className="flex-1"
        >
          취소
        </Button>
        <Button
          type="button"
          onClick={handleAdd}
          disabled={selectedKeys.size === 0}
          className="flex-1"
        >
          {selectedKeys.size > 0
            ? `${selectedKeys.size}개 추가`
            : "항목 선택"}
        </Button>
      </div>
    </OverlayLayer>
  );
}
