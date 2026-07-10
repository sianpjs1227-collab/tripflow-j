"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  MoreVertical,
  Wallet,
} from "lucide-react";
import type { Trip } from "@/types/trip";
import { isDepartingToday } from "@/lib/trip-lifecycle";
import {
  getTravelDayProgress,
  getTripDisplayName,
  getTripStatusBadge,
  tripStatusToneClass,
} from "@/lib/trip-home-utils";
import { useTripHomeStats } from "@/hooks/useTripHomeStats";
import { Button, Card, CountryFlag, Text } from "@/components/ui";
import TripCover from "./TripCover";

interface TripCardProps {
  trip: Trip;
  index?: number;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
}

/** 여행 카드 — Cover Image + 통계 */
export default function TripCard({
  trip,
  index = 0,
  onEdit,
  onDelete,
}: TripCardProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const showDepartingToday = isDepartingToday(trip.startDate);
  const stats = useTripHomeStats(trip);
  const statusBadge = getTripStatusBadge(trip);
  const progress = getTravelDayProgress(trip);
  const displayName = getTripDisplayName(trip);

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
    if (!confirm(`"${displayName}" 여행을 삭제할까요?`)) return;
    onDelete(trip);
  };

  return (
    <Card
      className="relative w-full overflow-hidden shadow-sm transition-all duration-300 ease-out hover:shadow-md animate-fade-in-up"
      style={{ animationDelay: `${(index + 2) * 80}ms` }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleNavigate}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleNavigate();
          }
        }}
        className="block w-full cursor-pointer text-left"
      >
        <div className="relative">
          <TripCover trip={trip} />

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span
              className={`inline-flex h-6 items-center rounded-full px-2 text-[11px] font-semibold leading-none backdrop-blur-sm ${tripStatusToneClass(statusBadge.tone)}`}
            >
              {statusBadge.label}
            </span>
            {progress && statusBadge.tone === "traveling" && (
              <span className="inline-flex h-6 items-center rounded-full bg-warning/90 px-2 text-[11px] font-semibold leading-none text-white backdrop-blur-sm">
                DAY {progress.currentDay}
              </span>
            )}
            {showDepartingToday && (
              <span className="inline-flex h-6 items-center rounded-full bg-warning/90 px-2 text-[11px] font-semibold leading-none text-white">
                오늘 출발
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="min-w-0 pr-8">
            <Text variant="title-sm" as="h3" className="text-lg font-bold">
              {displayName}
            </Text>
            <Text variant="muted" className="mt-1 flex items-center gap-1.5">
              <CountryFlag
                code={trip.countryCode}
                className="text-base"
                label={trip.country}
              />
              {trip.country} · {trip.city}
            </Text>
            <Text variant="caption" className="mt-2 block">
              {trip.startDate} ~ {trip.endDate} · {trip.duration}
            </Text>
          </div>

          {progress && statusBadge.tone === "traveling" && (
            <div>
              <div className="h-1.5 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-warning transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl bg-background px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-muted">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                <Text variant="caption">일정</Text>
              </div>
              <Text variant="body-medium" className="mt-1 font-semibold">
                {stats.scheduleCount}
              </Text>
            </div>
            <div className="rounded-xl bg-background px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-muted">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                <Text variant="caption">장소</Text>
              </div>
              <Text variant="body-medium" className="mt-1 font-semibold">
                {stats.placeCount}
              </Text>
            </div>
            <div className="rounded-xl bg-background px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-muted">
                <Wallet className="h-3.5 w-3.5" aria-hidden />
                <Text variant="caption">지출</Text>
              </div>
              <Text variant="caption" className="mt-1 line-clamp-2 font-semibold text-foreground">
                {stats.expensePrimary.replace(/^총\s/, "")}
              </Text>
            </div>
            <div className="rounded-xl bg-background px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-muted">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                <Text variant="caption">준비율</Text>
              </div>
              <Text variant="body-medium" className="mt-1 font-semibold">
                {stats.preparationRate != null
                  ? `${stats.preparationRate}%`
                  : "-"}
              </Text>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={menuRef}
        className="absolute right-3 top-3 z-10"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="h-8 w-8 bg-black/20 p-0 text-white backdrop-blur-sm hover:bg-black/30"
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
    </Card>
  );
}
