"use client";

import { useState } from "react";
import type { ExpenseCategory, ExpenseInput } from "@/types/expense";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: ExpenseInput) => void;
}

const EMPTY_FORM: ExpenseInput = {
  date: "",
  amount: "",
  category: "food",
  memo: "",
};

/**
 * 지출 추가 모달
 */
export default function ExpenseModal({ isOpen, onClose, onSave }: ExpenseModalProps) {
  const [form, setForm] = useState<ExpenseInput>(EMPTY_FORM);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleChange = (
    field: keyof ExpenseInput,
    value: string | ExpenseCategory,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.date || !form.amount.trim()) {
      setError("날짜와 금액을 입력해주세요.");
      return;
    }

    const amount = Number(form.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      setError("올바른 금액을 입력해주세요.");
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
          지출 추가
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
              금액
            </span>
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              placeholder="예: 15000"
              className="mt-1 w-full rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#111111] dark:text-white">
              분류
            </span>
            <select
              value={form.category}
              onChange={(e) =>
                handleChange("category", e.target.value as ExpenseCategory)
              }
              className="mt-1 w-full rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
            >
              <option value="transport">교통</option>
              <option value="food">식비</option>
              <option value="cafe">카페</option>
              <option value="shopping">쇼핑</option>
              <option value="other">기타</option>
            </select>
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
