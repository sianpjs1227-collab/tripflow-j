"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Share2, Users } from "lucide-react";
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
 * 여행 정보 카드 — 기본 한 줄 + ▼, 펼치면 My Maps·공유·참여자
 */
export default function TripInfoCard({
  trip,
  isOwner,
  myMapsUrl,
  onOpenMyMapsManage,
  onOpenShare,
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
        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left transition-colors hover:bg-background/80"
        aria-expanded={expanded}
        aria-label={expanded ? "여행정보 접기" : "여행정보 펼치기"}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
          <CountryFlag
            code={trip.countryCode}
            className="shrink-0 text-sm leading-none"
            label={trip.country}
          />
          <span className="min-w-0 truncate text-[11px] font-semibold leading-tight text-foreground">
            <span>{trip.city}</span>
            <span className="font-normal text-muted"> | </span>
            <span className="font-medium">
              <span aria-hidden>📅 </span>
              {trip.startDate} ~ {trip.endDate}
            </span>
            <span className="font-normal text-muted"> | </span>
            <span className="font-medium">
              <span aria-hidden>{statusIcon} </span>
              {statusLabel}
            </span>
            <span className="font-normal text-muted"> | </span>
            <span className="font-medium">{trip.duration}</span>
            {showDepartingToday && (
              <>
                <span className="font-normal text-muted"> | </span>
                <span className="font-medium text-warning">🛫 오늘 출발</span>
              </>
            )}
          </span>
        </div>

        {expanded ? (
          <ChevronUp
            className="h-3.5 w-3.5 shrink-0 text-muted"
            aria-hidden
          />
        ) : (
          <ChevronDown
            className="h-3.5 w-3.5 shrink-0 text-muted"
            aria-hidden
          />
        )}
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-border px-2.5 pb-2 pt-2 animate-fade-in">
          {hasCustomName && (
            <div className="rounded-xl bg-background px-2.5 py-2">
              <Text variant="caption">여행명</Text>
              <Text variant="body-medium" className="mt-0.5 text-sm font-semibold">
                {trip.name}
              </Text>
            </div>
          )}

          <div className="rounded-xl bg-background px-2.5 py-2">
            <Text variant="caption">국가</Text>
            <Text variant="body-medium" className="mt-0.5 text-sm font-semibold">
              {trip.country}
            </Text>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
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
                className="h-9 w-full text-sm"
              >
                🗺 My Maps 열기
              </Button>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenMyMapsManage}
              className="h-9 text-sm text-muted"
            >
              My Maps 설정
            </Button>
          </div>

          {isOwner && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onOpenShare}
              className="h-9 w-full text-sm"
            >
              <Share2 className="h-4 w-4" aria-hidden />
              여행 공유
            </Button>
          )}

          {authMode === "supabase" && (
            <div className="flex items-center gap-2 rounded-xl bg-background px-2.5 py-2">
              <Users className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              <div className="min-w-0">
                <Text variant="caption">참여자</Text>
                <Text variant="body-medium" className="text-sm font-semibold">
                  {memberCount == null ? "불러오는 중…" : `${memberCount}명`}
                </Text>
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEditTrip}
            className="h-9 w-full justify-start px-1 text-sm text-primary"
          >
            여행 정보 수정
          </Button>
        </div>
      )}
    </Card>
  );
}
