"use client";

import { useMemo, useState } from "react";
import type { ChecklistInput, ChecklistItem } from "@/types/checklist";
import type { DefaultChecklistEntry } from "@/lib/default-checklist";
import { useTripDetail } from "@/contexts/TripDetailContext";
import {
  createChecklistItem,
  createChecklistItemFromDefault,
  groupChecklistByCategory,
  updateChecklistItem,
} from "@/lib/checklist-utils";
import { Button, Text } from "@/components/ui";
import ChecklistModal from "./ChecklistModal";
import ChecklistAddOptionsModal from "./ChecklistAddOptionsModal";
import ChecklistDefaultPickerModal from "./ChecklistDefaultPickerModal";
import ChecklistCategorySection from "./ChecklistCategorySection";

function ChecklistTabContent() {
  const { data, updateData } = useTripDetail();
  const [isAddOptionsOpen, setIsAddOptionsOpen] = useState(false);
  const [isDefaultPickerOpen, setIsDefaultPickerOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);

  const items = data.checklist;
  const checkedCount = items.filter((item) => item.checked).length;
  const groupedItems = useMemo(() => groupChecklistByCategory(items), [items]);

  const openAddOptions = () => {
    setEditingItem(null);
    setIsAddOptionsOpen(true);
  };

  const openEditModal = (item: ChecklistItem) => {
    setEditingItem(item);
    setIsManualModalOpen(true);
  };

  const closeManualModal = () => {
    setIsManualModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = (input: ChecklistInput) => {
    updateData((prev) => {
      if (editingItem) {
        return {
          ...prev,
          checklist: prev.checklist.map((item) =>
            item.id === editingItem.id
              ? updateChecklistItem(item, input)
              : item,
          ),
        };
      }

      return {
        ...prev,
        checklist: [...prev.checklist, createChecklistItem(input)],
      };
    });
  };

  const handleAddDefaults = (entries: DefaultChecklistEntry[]) => {
    updateData((prev) => ({
      ...prev,
      checklist: [
        ...prev.checklist,
        ...entries.map(createChecklistItemFromDefault),
      ],
    }));
  };

  const handleDelete = (id: string) => {
    updateData((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((item) => item.id !== id),
    }));
  };

  const handleToggle = (id: string) => {
    updateData((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    }));
  };

  return (
    <div className="space-y-4">
      <Text variant="title-sm" as="h2">
        체크리스트
      </Text>
      {items.length > 0 && (
        <Text variant="muted" className="mt-2">
          {checkedCount}/{items.length} 완료
        </Text>
      )}

      <Button type="button" onClick={openAddOptions} className="w-full">
        항목 추가
      </Button>

      {items.length === 0 ? (
        <Text variant="muted" className="mt-6">
          아직 등록된 항목이 없습니다.
        </Text>
      ) : (
        <div className="mt-6 space-y-2">
          {groupedItems.map((group) => (
            <ChecklistCategorySection
              key={group.category}
              category={group.category}
              items={group.items}
              onToggle={handleToggle}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ChecklistAddOptionsModal
        isOpen={isAddOptionsOpen}
        onClose={() => setIsAddOptionsOpen(false)}
        onSelectDefaults={() => setIsDefaultPickerOpen(true)}
        onSelectManual={() => setIsManualModalOpen(true)}
      />

      <ChecklistDefaultPickerModal
        isOpen={isDefaultPickerOpen}
        existingItems={items}
        onClose={() => setIsDefaultPickerOpen(false)}
        onAdd={handleAddDefaults}
      />

      <ChecklistModal
        isOpen={isManualModalOpen}
        editingItem={editingItem}
        onClose={closeManualModal}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}

/** 체크리스트 탭 — TripDetailData.checklist 사용 */
export default function ChecklistTab() {
  return <ChecklistTabContent />;
}
