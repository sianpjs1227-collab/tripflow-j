"use client";

import { useCallback, useState } from "react";
import type { Place } from "@/types/place";
import {
  createMapPreviewState,
  createMapPreviewStateFromPlace,
  type MapPreviewLocation,
  type MapPreviewState,
  type OpenMapPreviewOptions,
} from "@/lib/map-preview";

/** PlaceActionSheet 열기/닫기 */
export function usePlaceActionSheet() {
  const [previewState, setPreviewState] = useState<MapPreviewState | null>(
    null,
  );

  const openPlace = useCallback(
    (target: Place | MapPreviewLocation, options?: OpenMapPreviewOptions) => {
      if ("category" in target) {
        setPreviewState(createMapPreviewStateFromPlace(target, options));
        return;
      }

      setPreviewState({
        ...createMapPreviewState(target),
        schedulePrefill: options?.schedulePrefill,
        distanceMeters: options?.distanceMeters,
        walkingMinutes: options?.walkingMinutes,
      });
    },
    [],
  );

  const closePlace = useCallback(() => {
    setPreviewState(null);
  }, []);

  return {
    previewState,
    openPlace,
    closePlace,
    isOpen: previewState !== null,
  };
}

/** @deprecated usePlaceActionSheet 사용 */
export const useMapPreview = usePlaceActionSheet;
