"use client";

import { useEffect, useState } from "react";
import type { AddPlaceToScheduleInput } from "@/types/place";
import type { Place } from "@/types/place";

interface AddPlaceToScheduleModalProps {
  isOpen: boolean;
  place: Place | null;
  onClose: () => void;
  onSave: (input: AddPlaceToScheduleInput) => void;
}

const EMPTY_FORM: AddPlaceToScheduleInput = {
  date: "",
  time: "",
};

/** 장소 → 일정 추가 (날짜·시간만 입력) */
export default function AddPlaceToScheduleModal({
  isOpen,
  place,
  onClose,
  onSave,
}: AddPlaceToScheduleModalProps) {
  const [form, setForm] = useState<AddPlaceToScheduleInput>(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setError("");
    }
  }, [isOpen, place?.id]);

  if (!isOpen || !place) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.date || !form.time) {
      setError("날짜와 시간을 입력해주세요.");
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
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
        aria-label="모달 닫기"
      />

      <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-[#1c1c1e]">
        <h2 className="text-xl font-bold text-[#111111] dark:text-white">
          일정에 추가
        </h2>
        <p className="mt-1 text-sm text-[#6e6e73]">{place.name}</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[#111111] dark:text-white">
              날짜
            </span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, date: e.target.value }));
                setError("");
              }}
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
              onChange={(e) => {
                setForm((prev) => ({ ...prev, time: e.target.value }));
                setError("");
              }}
              className="mt-1 w-full rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
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
