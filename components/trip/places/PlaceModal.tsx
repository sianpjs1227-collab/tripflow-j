"use client";

import { useEffect, useState } from "react";
import type { Place, PlaceCategory, PlaceInput } from "@/types/place";
import { placeCategories, placeCategoryLabels } from "@/lib/place-utils";

interface PlaceModalProps {
  isOpen: boolean;
  editingPlace: Place | null;
  onClose: () => void;
  onSave: (input: PlaceInput) => void;
}

const EMPTY_FORM: PlaceInput = {
  name: "",
  category: "restaurant_bar",
  mapsLink: "",
  memo: "",
};

/** 장소 추가/수정 모달 */
export default function PlaceModal({
  isOpen,
  editingPlace,
  onClose,
  onSave,
}: PlaceModalProps) {
  const [form, setForm] = useState<PlaceInput>(EMPTY_FORM);
  const [error, setError] = useState("");
  const isEditing = editingPlace !== null;

  useEffect(() => {
    if (!isOpen) return;

    if (editingPlace) {
      setForm({
        name: editingPlace.name,
        category: editingPlace.category,
        mapsLink: editingPlace.mapsLink ?? "",
        memo: editingPlace.memo ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError("");
  }, [isOpen, editingPlace]);

  if (!isOpen) return null;

  const handleChange = (
    field: keyof PlaceInput,
    value: string | PlaceCategory,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("장소명을 입력해주세요.");
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
          {isEditing ? "장소 수정" : "장소 추가"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[#111111] dark:text-white">
              장소명
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="예: 우나기노 에이토"
              className="mt-1 w-full rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#111111] dark:text-white">
              카테고리
            </span>
            <select
              value={form.category}
              onChange={(e) =>
                handleChange("category", e.target.value as PlaceCategory)
              }
              className="mt-1 w-full rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
            >
              {placeCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {placeCategoryLabels[cat]}
                </option>
              ))}
            </select>
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
