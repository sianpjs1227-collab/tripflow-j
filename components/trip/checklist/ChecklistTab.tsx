"use client";

import { useState } from "react";
import type { ChecklistInput, ChecklistItem } from "@/types/checklist";
import { useTripDetail } from "@/contexts/TripDetailContext";
import {
  createChecklistItem,
  updateChecklistItem,
} from "@/lib/checklist-utils";
import ChecklistModal from "./ChecklistModal";

function ChecklistTabContent() {
  const { data, updateData } = useTripDetail();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);

  const items = data.checklist;
  const checkedCount = items.filter((item) => item.checked).length;

  const openCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ChecklistItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
    <div className="p-6">
      <h2 className="text-lg font-semibold">체크리스트</h2>
      {items.length > 0 && (
        <p className="mt-2 text-sm text-[#6e6e73]">
          {checkedCount}/{items.length} 완료
        </p>
      )}

      <button
        type="button"
        onClick={openCreateModal}
        className="mt-4 w-full rounded-xl bg-[#0A84FF] py-3 text-sm font-semibold text-white"
      >
        항목 추가
      </button>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-[#6e6e73]">
          아직 등록된 항목이 없습니다.
        </p>
      ) : (
        <ul className="mt-6 space-y-2" role="list">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[#ebebeb] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.05]"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => handleToggle(item.id)}
                  className="h-5 w-5 shrink-0 rounded border-[#ebebeb] accent-[#0A84FF]"
                  aria-label={`${item.text} 체크`}
                />

                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className={`min-w-0 flex-1 text-left text-base ${
                    item.checked
                      ? "text-[#6e6e73] line-through"
                      : "text-[#111111] dark:text-white"
                  }`}
                >
                  {item.text}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!confirm("이 항목을 삭제할까요?")) return;
                    handleDelete(item.id);
                  }}
                  className="shrink-0 text-sm text-[#6e6e73] hover:text-red-500"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ChecklistModal
        isOpen={isModalOpen}
        editingItem={editingItem}
        onClose={closeModal}
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
