"use client";

import { useEffect, useState } from "react";
import type { ScheduleInput, ScheduleItem } from "@/types/schedule";

interface ScheduleModalProps {
  isOpen: boolean;
  editingItem: ScheduleItem | null;
  onClose: () => void;
  onSave: (input: ScheduleInput) => void;
  onDelete?: (id: string) => void;
}

const EMPTY_FORM: ScheduleInput = {
  date: "",
  time: "",
  title: "",
  placeName: "",
  mapsLink: "",
  memo: "",
};

/**
 * 일정 추가/수정 모달
 */
export default function ScheduleModal({
  isOpen,
  editingItem,
  onClose,
  onSave,
  onDelete,
}: ScheduleModalProps) {
  const [form, setForm] = useState<ScheduleInput>(EMPTY_FORM);
  const [error, setError] = useState("");
  const isEditing = editingItem !== null;

  useEffect(() => {
    if (!isOpen) return;

    if (editingItem) {
      setForm({
        date: editingItem.date,
        time: editingItem.time,
        title: editingItem.title,
        placeName: editingItem.placeName,
        mapsLink: editingItem.mapsLink ?? "",
        memo: editingItem.memo ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError("");
  }, [isOpen, editingItem]);

  if (!isOpen) return null;

  const handleChange = (field: keyof ScheduleInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.date || !form.time || !form.title.trim() || !form.placeName.trim()) {
      setError("날짜, 시간, 일정 제목, 장소명을 입력해주세요.");
      return;
    }

    onSave(form);
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  const handleDelete = () => {
    if (!editingItem || !onDelete) return;
    if (!confirm("이 일정을 삭제할까요?")) return;
    onDelete(editingItem.id);
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setError("");
    onClose();
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
          {isEditing ? "일정 수정" : "일정 추가"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[#111111] dark:text-white">
              날짜
            </span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#111111] dark:text-white">
              시간
            </span>
            <input
              type="time"
              value={form.time}
              onChange={(e) => handleChange("time", e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#111111] dark:text-white">
              일정 제목
            </span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="예: 점심"
              className="mt-1 w-full rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#111111] dark:text-white">
              장소명
            </span>
            <input
              type="text"
              value={form.placeName}
              onChange={(e) => handleChange("placeName", e.target.value)}
              placeholder="예: 우나기노 에이토"
              className="mt-1 w-full rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#111111] dark:text-white">
              Google Maps 링크 <span className="text-[#6e6e73]">(선택)</span>
            </span>
            <input
              type="url"
              value={form.mapsLink}
              onChange={(e) => handleChange("mapsLink", e.target.value)}
              placeholder="https://maps.google.com/..."
              className="mt-1 w-full rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#111111] dark:text-white">
              메모 <span className="text-[#6e6e73]">(선택)</span>
            </span>
            <textarea
              value={form.memo}
              onChange={(e) => handleChange("memo", e.target.value)}
              placeholder="추가 메모"
              rows={3}
              className="mt-1 w-full resize-none rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
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
                className="rounded-xl border border-red-200 px-4 py-3 font-medium text-red-500 dark:border-red-500/30"
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
