"use client";

import { useEffect, useState } from "react";
import type { ChecklistInput, ChecklistItem } from "@/types/checklist";

interface ChecklistModalProps {
  isOpen: boolean;
  editingItem?: ChecklistItem | null;
  onClose: () => void;
  onSave: (input: ChecklistInput) => void;
  onDelete?: (id: string) => void;
}

const EMPTY_FORM: ChecklistInput = { text: "" };

export default function ChecklistModal({
  isOpen,
  editingItem = null,
  onClose,
  onSave,
  onDelete,
}: ChecklistModalProps) {
  const [form, setForm] = useState<ChecklistInput>(EMPTY_FORM);
  const [error, setError] = useState("");
  const isEditing = editingItem !== null;

  useEffect(() => {
    if (!isOpen) return;
    setForm(editingItem ? { text: editingItem.text } : EMPTY_FORM);
    setError("");
  }, [isOpen, editingItem]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.text.trim()) {
      setError("항목 내용을 입력해주세요.");
      return;
    }

    onSave(form);
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  const handleDelete = () => {
    if (!editingItem || !onDelete) return;
    if (!confirm("이 항목을 삭제할까요?")) return;
    onDelete(editingItem.id);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
        aria-label="모달 닫기"
      />

      <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-[#1c1c1e]">
        <h2 className="text-xl font-bold text-[#111111] dark:text-white">
          {isEditing ? "항목 수정" : "항목 추가"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[#111111] dark:text-white">
              항목
            </span>
            <input
              type="text"
              value={form.text}
              onChange={(e) => {
                setForm({ text: e.target.value });
                setError("");
              }}
              placeholder="예: 여권"
              className="mt-1 w-full rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
            />
          </label>

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-500 dark:border-red-500/30"
              >
                삭제
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-xl border border-[#ebebeb] py-3 font-medium text-[#111111] dark:border-white/20 dark:text-white"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-[#0A84FF] py-3 font-semibold text-white"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
