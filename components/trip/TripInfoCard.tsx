"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Trip } from "@/types/trip";
import { isDepartingToday } from "@/lib/trip-lifecycle";
import { tripStatusDisplay, tripStatusIcon } from "@/lib/trip-status";
import { openMapsUrl } from "@/lib/trip-maps";
import { fetchSupabaseTripMembersByTripId } from "@/lib/supabase-trip-members";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Card, CountryFlag, Text } from "@/components/ui";

const EXPAND_STORAGE_PREFIX = "tripflow-trip-info-expanded:";

interface TripInfoCardProps {
  trip: Trip;
  isOwner: boolean;
  myMapsUrl: string;
  onOpenMyMapsManage: () => void;
  onOpenShare: () => void;
  onEditTrip: () => void;
}

function readExpanded(tripId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(`${EXPAND_STORAGE_PREFIX}${tripId}`) === "1";
  } catch {
    return false;
  }
}

function writeExpanded(tripId: string, expanded: boolean): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      `${EXPAND_STORAGE_PREFIX}${tripId}`,
      expanded ? "1" : "0",
    );
  } catch {
    // ignore
  }
}

/**
 * 여행 정보 카드 — 기본 한 줄 + ▼, 펼치면 My Maps·참여자·설정
 */
export default function TripInfoCard({
  trip,
  isOwner: _isOwner,
  myMapsUrl,
  onOpenMyMapsManage,
  onOpenShare: _onOpenShare,
  onEditTrip,
}: TripInfoCardProps) {
  const { mode: authMode } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const isMyMapsConnected = Boolean(myMapsUrl);
  const showDepartingToday = isDepartingToday(trip.startDate);
  const statusIcon = tripStatusIcon[trip.status];
  const statusLabel = tripStatusDisplay[trip.status].replace(/^[^\s]+\s/, "");

  useEffect(() => {
    setExpanded(readExpanded(trip.id));
  }, [trip.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      if (authMode !== "supabase") {
        if (!cancelled) setMemberCount(null);
        return;
      }

      try {
        const members = await fetchSupabaseTripMembersByTripId(trip.id);
        if (!cancelled) setMemberCount(members.length);
      } catch {
        if (!cancelled) setMemberCount(null);
      }
    }

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [authMode, trip.id, expanded]);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      writeExpanded(trip.id, next);
      return next;
    });
  };

  const hasCustomName =
    trip.name.trim() !== "" && trip.name.trim() !== trip.city.trim();

  return (
    <Card padding="none" className="overflow-hidden">
      <button
        type="button"
        onClick={toggleExpanded}
        className="flex w-full items-start gap-2 px-3 py-[1.125rem] text-left transition-colors hover:bg-background/80 sm:gap-2.5 sm:px-3.5 sm:py-3.5"
        aria-expanded={expanded}
        aria-label={expanded ? "여행정보 접기" : "여행정보 펼치기"}
      >
        <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-1.5">
          {/* 1행: 국기 + 여행지 | 여행기간 */}
          <div className="flex min-w-0 items-baseline justify-between gap-2.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <CountryFlag
                code={trip.countryCode}
                className="shrink-0 text-[1.125rem] leading-none sm:text-base"
                label={trip.country}
              />
              <span className="min-w-0 truncate text-[15px] font-bold leading-snug tracking-tight text-foreground sm:text-[14px]">
                {trip.city}
              </span>
            </div>
            <span className="shrink-0 text-[12px] font-medium leading-snug text-muted sm:text-[12px]">
              <span aria-hidden>📅 </span>
              {trip.startDate} ~ {trip.endDate}
            </span>
          </div>

          {/* 2행: 여행상태 | 여행일수 */}
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] font-medium leading-snug text-foreground sm:text-[12px]">
            <span className="inline-flex items-center gap-1">
              <span aria-hidden>{statusIcon}</span>
              <span>{statusLabel}</span>
            </span>
            <span className="text-muted" aria-hidden>
              ·
            </span>
            <span>{trip.duration}</span>
            {showDepartingToday && (
              <>
                <span className="text-muted" aria-hidden>
                  ·
                </span>
                <span className="font-medium text-warning">🛫 오늘 출발</span>
              </>
            )}
          </div>
        </div>

        {expanded ? (
          <ChevronUp
            className="mt-0.5 h-4 w-4 shrink-0 text-muted sm:h-3.5 sm:w-3.5"
            aria-hidden
          />
        ) : (
          <ChevronDown
            className="mt-0.5 h-4 w-4 shrink-0 text-muted sm:h-3.5 sm:w-3.5"
            aria-hidden
          />
        )}
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-border px-3 pb-3.5 pt-3 animate-fade-in sm:px-3.5 sm:pb-3 sm:pt-2.5">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-foreground">
            <CountryFlag
              code={trip.countryCode}
              className="shrink-0 text-base leading-none"
              label={trip.country}
            />
            <span>
              {trip.country}
              <span className="text-muted"> · </span>
              {trip.city}
            </span>
          </div>

          {hasCustomName && (
            <Text variant="caption" className="block text-[11px]">
              {trip.name}
            </Text>
          )}

          <div className="rounded-xl border border-border bg-background px-2.5 py-2">
            <Text
              variant="caption"
              className="mb-1.5 block text-[11px] font-medium"
            >
              My Maps
            </Text>
            <div className="flex gap-2">
              <span
                className="inline-flex flex-1"
                title={
                  !isMyMapsConnected
                    ? "Google My Maps를 먼저 연결하세요."
                    : undefined
                }
              >
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!isMyMapsConnected}
                  onClick={() => myMapsUrl && openMapsUrl(myMapsUrl)}
                  className="h-8 w-full text-[11px]"
                >
                  열기
                </Button>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onOpenMyMapsManage}
                className="h-8 flex-1 text-[11px] text-muted"
              >
                설정
              </Button>
            </div>
          </div>

          {authMode === "supabase" && (
            <Text variant="body" className="px-0.5 text-[12px] text-foreground">
              {memberCount == null
                ? "참여자 불러오는 중…"
                : `👥 ${memberCount}명 참여`}
            </Text>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEditTrip}
            className="h-8 w-full justify-start px-0.5 text-[12px] text-primary"
          >
            여행 설정
          </Button>
        </div>
      )}
    </Card>
  );
}
