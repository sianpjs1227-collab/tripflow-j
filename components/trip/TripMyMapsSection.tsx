"use client";

import { useEffect, useState } from "react";
import {
  loadMyMapsLink,
  normalizeMapsUrl,
  openMapsUrl,
  saveMyMapsLink,
} from "@/lib/trip-maps";

interface TripMyMapsSectionProps {
  tripId: string;
}

/**
 * Google My Maps 링크 저장 및 열기
 * localStorage에 저장되어 새로고침 후에도 유지됩니다.
 */
export default function TripMyMapsSection({ tripId }: TripMyMapsSectionProps) {
  const [inputLink, setInputLink] = useState("");
  const [savedLink, setSavedLink] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // 앱을 열면 localStorage에서 자동으로 불러옴
  useEffect(() => {
    const stored = loadMyMapsLink(tripId);
    if (stored) setSavedLink(stored);
    setHydrated(true);
  }, [tripId]);

  const handleSave = () => {
    if (!inputLink.trim()) return;
    const url = normalizeMapsUrl(inputLink);
    setSavedLink(url);
    saveMyMapsLink(tripId, url);
    setInputLink("");
  };

  const handleOpen = () => {
    if (savedLink) openMapsUrl(savedLink);
  };

  if (!hydrated) return null;

  if (savedLink) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="mt-3 rounded-xl border border-[#ebebeb] px-4 py-2 text-sm font-medium text-[#0A84FF] hover:border-[#0A84FF]/30 dark:border-white/20"
      >
        내 여행 지도 보기
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <label className="block text-sm font-medium text-[#111111] dark:text-white">
        Google My Maps 링크 입력
      </label>
      <input
        type="url"
        value={inputLink}
        onChange={(e) => setInputLink(e.target.value)}
        placeholder="https://www.google.com/maps/d/..."
        className="w-full rounded-xl border border-[#ebebeb] px-4 py-2.5 text-sm outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={!inputLink.trim()}
        className="rounded-xl bg-[#0A84FF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        저장
      </button>
    </div>
  );
}
