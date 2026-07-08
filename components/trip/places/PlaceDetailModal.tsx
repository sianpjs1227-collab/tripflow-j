"use client";

import type { Place } from "@/types/place";
import {
  placeCategoryIcons,
  placeCategoryLabels,
  truncateMemo,
} from "@/lib/place-utils";
import { openDirectionsToPlace } from "@/lib/directions";

interface PlaceDetailModalProps {
  place: Place | null;
  onClose: () => void;
  onAddToSchedule: (place: Place) => void;
  onEdit: (place: Place) => void;
  onDelete: (place: Place) => void;
}

/** 장소 상세 — 액션 버튼 제공 */
export default function PlaceDetailModal({
  place,
  onClose,
  onAddToSchedule,
  onEdit,
  onDelete,
}: PlaceDetailModalProps) {
  if (!place) return null;

  const handleDirections = () => {
    void openDirectionsToPlace(place);
  };

  const handleDelete = () => {
    if (!confirm(`"${place.name}" 장소를 삭제할까요?`)) return;
    onDelete(place);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="모달 닫기"
      />

      <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-[#1c1c1e]">
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden>
            {placeCategoryIcons[place.category]}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-[#111111] dark:text-white">
              {place.name}
            </h2>
            <p className="mt-1 text-sm text-[#6e6e73]">
              {placeCategoryLabels[place.category]}
            </p>
            {place.memo && (
              <p className="mt-2 text-sm text-[#6e6e73]">{place.memo}</p>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={handleDirections}
            className="w-full rounded-xl border border-[#ebebeb] py-3 text-sm font-medium text-[#0A84FF] dark:border-white/20"
          >
            🧭 길찾기
          </button>
          <button
            type="button"
            onClick={() => {
              onAddToSchedule(place);
            }}
            className="w-full rounded-xl bg-[#0A84FF] py-3 text-sm font-semibold text-white"
          >
            일정에 추가
          </button>
          <button
            type="button"
            onClick={() => {
              onEdit(place);
            }}
            className="w-full rounded-xl border border-[#ebebeb] py-3 text-sm font-medium text-[#111111] dark:border-white/20 dark:text-white"
          >
            수정
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-500 dark:border-red-500/30"
          >
            삭제
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm text-[#6e6e73] hover:underline"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

/** 장소 카드 (목록용) */
export function PlaceCard({
  place,
  onClick,
}: {
  place: Place;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-[#ebebeb] bg-white px-4 py-3 text-left transition-colors hover:border-[#0A84FF]/30 dark:border-white/10 dark:bg-white/[0.05]"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl leading-none" aria-hidden>
          {placeCategoryIcons[place.category]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-[#111111] dark:text-white">
            {place.name}
          </p>
          {place.memo && (
            <p className="mt-1 truncate text-sm text-[#6e6e73]">
              {truncateMemo(place.memo)}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
