"use client";

import { useState } from "react";
import {
  getCurrentPosition,
  LOCATION_DENIED_MESSAGE,
  type GeoPosition,
} from "@/lib/directions";

interface NearbyPlacesButtonProps {
  onOpen: (position: GeoPosition) => void;
}

/** 내 주변 진입 버튼 */
export default function NearbyPlacesButton({ onOpen }: NearbyPlacesButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    try {
      const position = await getCurrentPosition();
      onOpen(position);
    } catch {
      window.alert(LOCATION_DENIED_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => {
        void handleClick();
      }}
      disabled={isLoading}
      className="w-full rounded-xl border border-[#ebebeb] bg-white py-3 text-sm font-semibold text-[#111111] transition-colors hover:border-[#0A84FF]/30 disabled:opacity-60 dark:border-white/20 dark:bg-white/[0.05] dark:text-white"
    >
      {isLoading ? "위치 확인 중…" : "📍 내 주변"}
    </button>
  );
}
