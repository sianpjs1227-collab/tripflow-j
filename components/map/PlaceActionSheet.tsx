"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CalendarPlus, Navigation, Star } from "lucide-react";
import type { Place, PlaceTravelRecordInput } from "@/types/place";
import type { ScheduleInput } from "@/types/schedule";
import { getCurrentPosition, type GeoPosition } from "@/lib/directions";
import {
  calculateDistanceMeters,
  estimateWalkingMinutes,
  formatDistanceMeters,
} from "@/lib/nearby-utils";
import {
  openDirectionsForPreviewState,
  openGoogleMapsForPreviewState,
  previewStateHasGoogleMaps,
  previewStateHasPlaceActions,
  type MapPreviewState,
} from "@/lib/map-preview";
import {
  placeCategoryIcons,
  placeCategoryLabels,
} from "@/lib/place-utils";
import {
  hasTravelRecordContent,
} from "@/lib/place-visit";
import { Button, Card, OverlayLayer, Text } from "@/components/ui";
import PlaceTravelRecordSheet from "@/components/trip/places/PlaceTravelRecordSheet";
import { cn } from "@/lib/cn";

const MapPreview = dynamic(() => import("./MapPreview"), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-border bg-background text-sm text-muted">
      지도 불러오는 중…
    </div>
  ),
});

interface PlaceActionSheetProps {
  previewState: MapPreviewState | null;
  onClose: () => void;
  isFavorite: (placeId: string) => boolean;
  onToggleFavorite: (placeId: string) => void;
  onAddToSchedule: (place: Place, prefill?: Partial<ScheduleInput>) => void;
  onDeletePlace?: (place: Place) => void;
  getPlace?: (placeId: string) => Place | undefined;
  onSaveTravelRecord?: (placeId: string, input: PlaceTravelRecordInput) => void;
  knownCurrentPosition?: GeoPosition | null;
}

function useDistanceInfo(
  previewState: MapPreviewState | null,
  currentPosition: GeoPosition | null,
) {
  return useMemo(() => {
    if (!previewState) return null;

    if (previewState.distanceMeters != null) {
      return {
        distanceMeters: previewState.distanceMeters,
        walkingMinutes:
          previewState.walkingMinutes ??
          estimateWalkingMinutes(previewState.distanceMeters),
      };
    }

    const location = previewState.location;
    if (!location || !currentPosition) return null;

    const distanceMeters = calculateDistanceMeters(currentPosition, {
      latitude: location.latitude,
      longitude: location.longitude,
    });

    return {
      distanceMeters,
      walkingMinutes: estimateWalkingMinutes(distanceMeters),
    };
  }, [previewState, currentPosition]);
}

function PlaceActionButtons({
  previewState,
  currentPosition,
  isFavorite,
  onToggleFavorite,
  onAddToSchedule,
  onOpenTravelRecord,
  onRequestDelete,
  getPlace,
  onClose,
}: {
  previewState: MapPreviewState;
  currentPosition: GeoPosition | null;
  isFavorite: (placeId: string) => boolean;
  onToggleFavorite: (placeId: string) => void;
  onAddToSchedule: (place: Place, prefill?: Partial<ScheduleInput>) => void;
  onOpenTravelRecord?: () => void;
  onRequestDelete?: () => void;
  getPlace?: (placeId: string) => Place | undefined;
  onClose: () => void;
}) {
  const { actionsSource, schedulePrefill } = previewState;
  const hasGoogleMaps = previewStateHasGoogleMaps(previewState);
  const hasPlaceActions = previewStateHasPlaceActions(previewState);
  const livePlace = getPlace?.(actionsSource.id) ?? actionsSource;
  const favorite = hasPlaceActions && isFavorite(actionsSource.id);
  const hasRecord = hasPlaceActions && hasTravelRecordContent(livePlace);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          openDirectionsForPreviewState(
            previewState,
            currentPosition ?? undefined,
          )
        }
        className="w-full text-primary"
      >
        <Navigation className="h-4 w-4 shrink-0" aria-hidden />
        길찾기
      </Button>
      {hasPlaceActions && (
        <>
          <Button
            type="button"
            onClick={() => {
              onAddToSchedule(actionsSource, schedulePrefill);
              onClose();
            }}
            className="w-full"
          >
            <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden />
            일정추가
          </Button>
          {onOpenTravelRecord && (
            <Button
              type="button"
              variant="secondary"
              onClick={onOpenTravelRecord}
              className={cn(
                "w-full",
                hasRecord &&
                  "border-success/30 bg-success/10 text-success hover:bg-success/15",
              )}
            >
              <span className="text-base" aria-hidden>
                📝
              </span>
              <span className="flex flex-col items-start text-left">
                <span>여행 기록</span>
                {hasRecord && (
                  <span className="text-xs font-normal opacity-80">
                    기록 있음
                  </span>
                )}
              </span>
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => onToggleFavorite(actionsSource.id)}
            className={cn(
              "w-full",
              favorite &&
                "border-warning/30 bg-warning/10 text-warning hover:bg-warning/15",
            )}
            aria-pressed={favorite}
          >
            <Star
              className={cn("h-4 w-4 shrink-0", favorite && "fill-current")}
              aria-hidden
            />
            즐겨찾기
          </Button>
          {onRequestDelete && (
            <Button
              type="button"
              variant="secondary"
              onClick={onRequestDelete}
              className="w-full border-danger/30 text-danger"
            >
              <span aria-hidden>🗑</span>
              장소 삭제
            </Button>
          )}
        </>
      )}
      {hasGoogleMaps && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => openGoogleMapsForPreviewState(previewState)}
          className="w-full text-primary"
        >
          Google Maps에서 크게 보기
        </Button>
      )}
    </div>
  );
}

/** 장소 액션 Bottom Sheet — 미니맵 + 지도·길찾기·일정·즐겨찾기·삭제 */
export default function PlaceActionSheet({
  previewState,
  onClose,
  isFavorite,
  onToggleFavorite,
  onAddToSchedule,
  onDeletePlace,
  getPlace,
  onSaveTravelRecord,
  knownCurrentPosition,
}: PlaceActionSheetProps) {
  const [currentPosition, setCurrentPosition] = useState<GeoPosition | null>(
    knownCurrentPosition ?? null,
  );
  const [locationLoading, setLocationLoading] = useState(false);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const distanceInfo = useDistanceInfo(previewState, currentPosition);

  useEffect(() => {
    if (!previewState) {
      setIsRecordOpen(false);
      setIsDeleteConfirmOpen(false);
    }
  }, [previewState]);

  useEffect(() => {
    if (!previewState) return;

    if (knownCurrentPosition) {
      setCurrentPosition(knownCurrentPosition);
      return;
    }

    setCurrentPosition(null);
    setLocationLoading(true);
    void getCurrentPosition()
      .then(setCurrentPosition)
      .catch(() => {
        /* 위치 거부 시 장소 마커만 표시 */
      })
      .finally(() => setLocationLoading(false));
  }, [previewState, knownCurrentPosition]);

  if (!previewState) return null;

  const { location, actionsSource } = previewState;
  const livePlace = getPlace?.(actionsSource.id) ?? actionsSource;
  const categoryIcon = placeCategoryIcons[actionsSource.category];
  const categoryLabel = placeCategoryLabels[actionsSource.category];
  const canDelete =
    Boolean(onDeletePlace) && previewStateHasPlaceActions(previewState);

  const handleSaveRecord = (placeId: string, input: PlaceTravelRecordInput) => {
    onSaveTravelRecord?.(placeId, input);
    setIsRecordOpen(false);
  };

  const handleConfirmDelete = () => {
    onDeletePlace?.(livePlace);
    setIsDeleteConfirmOpen(false);
    onClose();
  };

  const actionButtons = (
    <PlaceActionButtons
      previewState={previewState}
      currentPosition={currentPosition}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      onAddToSchedule={onAddToSchedule}
      onOpenTravelRecord={
        onSaveTravelRecord ? () => setIsRecordOpen(true) : undefined
      }
      onRequestDelete={
        canDelete ? () => setIsDeleteConfirmOpen(true) : undefined
      }
      getPlace={getPlace}
      onClose={onClose}
    />
  );

  return (
    <>
    <OverlayLayer
      onClose={onClose}
      closeLabel="장소 닫기"
      sheet
      panelClassName="bg-card p-5 shadow-xl transition-shadow duration-200"
    >
      <div role="dialog" aria-labelledby="place-action-sheet-title">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border sm:hidden" />

        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden>
            {categoryIcon}
          </span>
          <div className="min-w-0 flex-1">
            <Text
              variant="title-sm"
              as="h2"
              id="place-action-sheet-title"
              className="font-bold"
            >
              {previewState.title}
            </Text>
            <Text variant="muted" className="mt-0.5">
              {categoryLabel}
            </Text>
            {actionsSource.memo && (
              <Text variant="muted" className="mt-2">
                {actionsSource.memo}
              </Text>
            )}
            {actionsSource.address && (
              <Text variant="muted" className="mt-1">
                {actionsSource.address}
              </Text>
            )}
          </div>
        </div>

        {distanceInfo && (
          <Text variant="body" className="mt-3">
            거리{" "}
            <strong>{formatDistanceMeters(distanceInfo.distanceMeters)}</strong>
            {" · "}
            도보 예상{" "}
            <strong>약 {distanceInfo.walkingMinutes}분</strong>
          </Text>
        )}

        <div className="mt-4 space-y-3">
          {location ? (
            <>
              <MapPreview
                name={location.name}
                latitude={location.latitude}
                longitude={location.longitude}
                currentPosition={currentPosition}
                locationLoading={locationLoading}
              />
              {actionButtons}
            </>
          ) : (
            <>
              <Card padding="sm" className="bg-background">
                <Text variant="muted">
                  좌표 정보가 없어 앱 내 지도를 표시할 수 없습니다.
                </Text>
              </Card>
              {locationLoading && (
                <Text variant="muted">현재 위치 확인 중…</Text>
              )}
              {actionButtons}
            </>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="mt-4 w-full text-muted"
        >
          닫기
        </Button>
      </div>
    </OverlayLayer>

    {isDeleteConfirmOpen && (
      <OverlayLayer onClose={() => setIsDeleteConfirmOpen(false)}>
        <Card
          padding="lg"
          className="w-full max-w-sm animate-slide-up bg-card shadow-xl"
          role="dialog"
          aria-labelledby="place-delete-confirm-title"
        >
          <Text
            variant="title-sm"
            as="h2"
            id="place-delete-confirm-title"
          >
            이 장소를 삭제하시겠습니까?
          </Text>
          <div className="mt-5 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              className="flex-1 bg-danger text-white hover:bg-danger/90 active:bg-danger/95"
            >
              삭제
            </Button>
          </div>
        </Card>
      </OverlayLayer>
    )}

    {onSaveTravelRecord && (
      <PlaceTravelRecordSheet
        isOpen={isRecordOpen}
        place={livePlace}
        onClose={() => setIsRecordOpen(false)}
        onSave={handleSaveRecord}
      />
    )}
    </>
  );
}
