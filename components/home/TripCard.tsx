"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Trip } from "@/types/trip";
import { tripStatusDisplay } from "@/lib/trip-status";
import CountryFlag from "@/components/ui/CountryFlag";

interface TripCardProps {
  trip: Trip;
  index?: number;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
}

/** 여행 카드 — 클릭 시 상세 이동, ⋮ 메뉴로 수정/삭제 */
export default function TripCard({
  trip,
  index = 0,
  onEdit,
  onDelete,
}: TripCardProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleNavigate = () => {
    router.push(`/trip/${trip.id}`);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    if (!confirm(`"${trip.city}" 여행을 삭제할까요?`)) return;
    onDelete(trip);
  };

  return (
    <div
      className="
        relative w-full rounded-[24px] border border-[#ebebeb] bg-white
        shadow-[0_2px_16px_rgba(0,0,0,0.05)]
        transition-all duration-300 ease-out
        hover:border-[#e0e0e0] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)]
        dark:border-white/10 dark:bg-white/[0.08]
        dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)]
        dark:hover:border-white/15
        animate-fade-in-up
      "
      style={{ animationDelay: `${(index + 2) * 100}ms` }}
    >
      <button
        type="button"
        onClick={handleNavigate}
        className="w-full p-6 pr-14 text-left active:scale-[1.02] transition-transform"
      >
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-2 text-xl font-semibold text-[#111111] dark:text-[#f5f5f7]">
              <CountryFlag
                code={trip.countryCode}
                className="text-2xl"
                label={trip.country}
              />
              {trip.city}
            </h3>

            <p className="mt-2.5 text-sm text-[#6e6e73] dark:text-[#a1a1a6]">
              {trip.startDate} ~ {trip.endDate}
            </p>

            <p className="mt-1 text-sm text-[#6e6e73] dark:text-[#a1a1a6]">
              {trip.duration}
            </p>
          </div>

          <span className="shrink-0 pt-0.5 text-sm font-medium text-[#111111] dark:text-[#f5f5f7]">
            {tripStatusDisplay[trip.status]}
          </span>
        </div>
      </button>

      <div ref={menuRef} className="absolute right-4 top-4">
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-[#6e6e73] hover:bg-[#f5f5f5] dark:hover:bg-white/10"
          aria-label="여행 메뉴"
        >
          ⋮
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-xl border border-[#ebebeb] bg-white shadow-lg dark:border-white/10 dark:bg-[#1c1c1e]">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onEdit(trip);
              }}
              className="block w-full px-4 py-3 text-left text-sm text-[#111111] hover:bg-[#f5f5f5] dark:text-white dark:hover:bg-white/10"
            >
              수정
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="block w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
