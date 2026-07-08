"use client";

import { useEffect, useState } from "react";
import { COUNTRIES } from "@/data/countries";
import type { CreateTripInput, Trip } from "@/types/trip";
import {
  displayDateToIso,
  getCountryCodeByName,
} from "@/lib/trip-utils";

interface CreateTripModalProps {
  isOpen: boolean;
  editingTrip?: Trip | null;
  onClose: () => void;
  onSave: (input: CreateTripInput) => void;
}

const EMPTY_FORM: CreateTripInput = {
  name: "",
  countryCode: "",
  city: "",
  startDate: "",
  endDate: "",
};

/**
 * 새 여행 생성 / 여행 수정 모달
 */
export default function CreateTripModal({
  isOpen,
  editingTrip = null,
  onClose,
  onSave,
}: CreateTripModalProps) {
  const [form, setForm] = useState<CreateTripInput>(EMPTY_FORM);
  const [error, setError] = useState("");
  const isEditing = editingTrip !== null;

  useEffect(() => {
    if (!isOpen) return;

    if (editingTrip) {
      const city = editingTrip.city || editingTrip.name;
      const hasCustomName =
        editingTrip.name.trim() !== "" && editingTrip.name !== city;

      setForm({
        name: hasCustomName ? editingTrip.name : "",
        countryCode:
          editingTrip.countryCode ||
          getCountryCodeByName(editingTrip.country),
        city,
        startDate: displayDateToIso(editingTrip.startDate),
        endDate: displayDateToIso(editingTrip.endDate),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError("");
  }, [isOpen, editingTrip]);

  if (!isOpen) return null;

  const handleChange = (field: keyof CreateTripInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.countryCode || !form.city.trim() || !form.startDate || !form.endDate) {
      setError("국가, 도시, 날짜를 입력해주세요.");
      return;
    }

    if (form.endDate < form.startDate) {
      setError("종료일은 시작일 이후여야 합니다.");
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
          {isEditing ? "여행 수정" : "새 여행 만들기"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[#111111] dark:text-white">
              국가
            </span>
            <select
              value={form.countryCode}
              onChange={(e) => handleChange("countryCode", e.target.value)}
              className="country-flag mt-1 w-full rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
            >
              <option value="">국가를 선택하세요</option>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#111111] dark:text-white">
              도시
            </span>
            <input
              type="text"
              value={form.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder="예: 후쿠오카"
              className="mt-1 w-full rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#111111] dark:text-white">
              여행명{" "}
              <span className="font-normal text-[#6e6e73] dark:text-[#a1a1a6]">
                (선택)
              </span>
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="비우면 도시명이 사용됩니다"
              className="mt-1 w-full rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-[#111111] dark:text-white">
                시작일
              </span>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#111111] dark:text-white">
                종료일
              </span>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
              />
            </label>
          </div>

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
