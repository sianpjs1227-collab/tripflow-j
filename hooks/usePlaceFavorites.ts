"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadFavoritePlaceIds,
  saveFavoritePlaceIds,
} from "@/lib/place-favorites";

/** 여행별 장소 즐겨찾기 (placeId 기준, localStorage) */
export function usePlaceFavorites(tripId: string) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFavoriteIds(new Set(loadFavoritePlaceIds(tripId)));
    setHydrated(true);
  }, [tripId]);

  useEffect(() => {
    if (!hydrated) return;
    saveFavoritePlaceIds(tripId, [...favoriteIds]);
  }, [tripId, favoriteIds, hydrated]);

  const isFavorite = useCallback(
    (placeId: string) => favoriteIds.has(placeId),
    [favoriteIds],
  );

  const toggleFavorite = useCallback((placeId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) {
        next.delete(placeId);
      } else {
        next.add(placeId);
      }
      return next;
    });
  }, []);

  const removeFavorite = useCallback((placeId: string) => {
    setFavoriteIds((prev) => {
      if (!prev.has(placeId)) return prev;
      const next = new Set(prev);
      next.delete(placeId);
      return next;
    });
  }, []);

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    removeFavorite,
  };
}
