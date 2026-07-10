"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MoreVertical } from "lucide-react";
import type { Trip } from "@/types/trip";
import { isPlanningTrip, isTravelingTrip } from "@/lib/trip-status";
import {
  getHeroScheduleSnapshot,
  getTravelDayProgress,
  getTripDDayLabel,
  getTripDisplayName,
  getTripHomeStats,
} from "@/lib/trip-home-utils";
import { Button, Card, CountryFlag, Text } from "@/components/ui";
import TripCover from "./TripCover";

interface HeroCarouselCardProps {
  trip: Trip;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
}

function formatTripPeriod(trip: Trip): string {
  const endShort = trip.endDate.includes(".")
    ? trip.endDate.slice(trip.endDate.lastIndexOf(".") + 1)
    : trip.endDate;
  return `${trip.startDate} ~ ${endShort}`;
}

function StatCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <Text variant="caption" className="text-white/65">
        {label}
      </Text>
      <Text variant="body-medium" className="mt-0.5 truncate font-semibold text-white">
        {value}
      </Text>
    </div>
  );
}

/** Carousel Hero 슬라이드 — 커버 배경 + 오버레이 */
export default function HeroCarouselCard({
  trip,
  onEdit,
  onDelete,
}: HeroCarouselCardProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const stats = getTripHomeStats(trip);
  const schedule = getHeroScheduleSnapshot(trip);
  const progress = getTravelDayProgress(trip);
  const displayName = getTripDisplayName(trip);
  const isTraveling = isTravelingTrip(trip.status);
  const isPlanning = isPlanningTrip(trip.status);
  const ctaLabel = isTraveling ? "여행 이어가기" : "여행 준비하기";

  const statusBadge = isTraveling ? "여행중" : isPlanning ? "예정" : "완료";
  const highlightLabel = isTraveling
    ? progress
      ? `DAY ${progress.currentDay}`
      : "여행중"
    : isPlanning
      ? getTripDDayLabel(trip.startDate)
      : null;

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

  const handleContinue = () => {
    router.push(`/trip/${trip.id}`);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    if (!confirm(`"${displayName}" 여행을 삭제할까요?`)) return;
    onDelete(trip);
  };

  const expenseLabel = stats.expensePrimary.replace(/^총\s/, "");

  return (
    <article className="relative w-full overflow-hidden rounded-[1.75rem] shadow-lg transition-shadow duration-300 hover:shadow-xl">
      <div className="relative aspect-[4/5] w-full">
        <TripCover trip={trip} fill overlay={false} className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15" />

        <div className="relative flex h-full flex-col justify-between px-5 pb-5 pt-5 text-white sm:px-6 sm:pb-6 sm:pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex h-6 items-center rounded-full bg-white/20 px-2 text-[11px] font-semibold leading-none backdrop-blur-sm">
                {statusBadge}
              </span>
              {highlightLabel && (
                <span className="inline-flex h-6 items-center rounded-full bg-white/15 px-2 text-[11px] font-semibold leading-none backdrop-blur-sm">
                  {highlightLabel}
                </span>
              )}
            </div>

            <div ref={menuRef} className="relative z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="h-9 w-9 bg-black/25 p-0 text-white backdrop-blur-sm hover:bg-black/40"
                aria-label="여행 메뉴"
              >
                <MoreVertical className="h-5 w-5" aria-hidden />
              </Button>

              {isMenuOpen && (
                <Card className="absolute right-0 mt-1 min-w-[120px] overflow-hidden shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(trip);
                    }}
                    className="block w-full px-4 py-3 text-left text-sm text-foreground hover:bg-background"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="block w-full px-4 py-3 text-left text-sm text-danger hover:bg-danger/5"
                  >
                    삭제
                  </button>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <Text
                variant="caption"
                className="flex items-center gap-1.5 text-sm text-white/80"
              >
                <CountryFlag
                  code={trip.countryCode}
                  className="text-base"
                  label={trip.country}
                />
                {trip.country}
              </Text>
              <Text variant="title-sm" as="h2" className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">
                {displayName}
              </Text>
              {displayName !== trip.city && (
                <Text variant="body" className="mt-1 text-base text-white/85">
                  {trip.city}
                </Text>
              )}
              <Text variant="caption" className="mt-2 block text-white/70">
                {formatTripPeriod(trip)}
              </Text>
            </div>

            {isPlanning && (
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                <div className="grid grid-cols-3 gap-4">
                  <StatCell
                    label="체크리스트"
                    value={
                      stats.preparationRate != null
                        ? `${stats.preparationRate}%`
                        : "-"
                    }
                  />
                  <StatCell
                    label="저장한 장소"
                    value={`${stats.placeCount}개`}
                  />
                  <StatCell label="예상 지출" value={expenseLabel} />
                </div>
                {stats.preparationRate != null && (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-500"
                      style={{ width: `${stats.preparationRate}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {isTraveling && (
              <div className="space-y-3 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                <div className="grid grid-cols-3 gap-4">
                  <StatCell
                    label="DAY"
                    value={progress ? String(progress.currentDay) : "-"}
                  />
                  <StatCell
                    label="오늘 일정"
                    value={`${schedule.todayCount}개`}
                  />
                  <StatCell
                    label="다음 일정"
                    value={schedule.nextSchedule?.time ?? "-"}
                  />
                </div>
                {progress && (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs text-white/70">
                      <span>여행 진행률</span>
                      <span className="font-semibold text-white">
                        {progress.percent}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-warning transition-all duration-500"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleContinue}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-sm font-semibold text-foreground shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
