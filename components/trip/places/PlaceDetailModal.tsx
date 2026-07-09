"use client";

import { CalendarPlus, Navigation, Star } from "lucide-react";
import type { Place } from "@/types/place";
import {
  openGoogleMapsForPlace,
  placeCategoryIcons,
  placeCategoryLabels,
  placeHasMaps,
} from "@/lib/place-utils";
import { openDirectionsToPlace } from "@/lib/directions";
import { Button, OverlayLayer, Text } from "@/components/ui";
import { cn } from "@/lib/cn";

interface PlaceDetailModalProps {
  place: Place | null;
  isFavorite: boolean;
  onToggleFavorite: (placeId: string) => void;
  onClose: () => void;
  onAddToSchedule: (place: Place) => void;
  onEdit: (place: Place) => void;
  onDelete: (place: Place) => void;
}

/** 장소 상세 — 액션 버튼 제공 */
export default function PlaceDetailModal({
  place,
  isFavorite,
  onToggleFavorite,
  onClose,
  onAddToSchedule,
  onEdit,
  onDelete,
}: PlaceDetailModalProps) {
  if (!place) return null;

  const handleDelete = () => {
    if (!confirm(`"${place.name}" 장소를 삭제할까요?`)) return;
    onDelete(place);
    onClose();
  };

  return (
    <OverlayLayer
      onClose={onClose}
      closeLabel="모달 닫기"
      panelClassName="bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto"
    >
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden>
            {placeCategoryIcons[place.category]}
          </span>
          <div className="min-w-0 flex-1">
            <Text variant="title-sm" as="h2" className="text-xl font-bold">
              {place.name}
            </Text>
            <Text variant="muted" className="mt-1">
              {placeCategoryLabels[place.category]}
            </Text>
            {place.memo && (
              <Text variant="muted" className="mt-2">
                {place.memo}
              </Text>
            )}
            {place.address && (
              <Text variant="muted" className="mt-1">
                {place.address}
              </Text>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onToggleFavorite(place.id)}
            className={cn(
              "w-full",
              isFavorite &&
                "border-warning/30 bg-warning/10 text-warning hover:bg-warning/15",
            )}
            aria-pressed={isFavorite}
          >
            <Star
              className={cn("h-4 w-4 shrink-0", isFavorite && "fill-current")}
              aria-hidden
            />
            즐겨찾기
          </Button>
          {placeHasMaps(place) && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => openGoogleMapsForPlace(place)}
              className="w-full text-primary"
            >
              Google Maps에서 보기
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void openDirectionsToPlace(place);
            }}
            className="w-full text-primary"
          >
            <Navigation className="h-4 w-4 shrink-0" aria-hidden />
            길찾기
          </Button>
          <Button
            type="button"
            onClick={() => {
              onAddToSchedule(place);
            }}
            className="w-full"
          >
            <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden />
            일정에 추가
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              onEdit(place);
            }}
            className="w-full"
          >
            수정
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleDelete}
            className="w-full border-danger/30 text-danger"
          >
            삭제
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="mt-4 w-full text-muted"
        >
          닫기
        </Button>
    </OverlayLayer>
  );
}
