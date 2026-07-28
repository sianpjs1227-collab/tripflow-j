import { mergeRemoteAndLocalPlaces } from "@/lib/place-merge";
import { getVisiblePlaces } from "@/lib/place-utils";
import { isUuid } from "@/lib/supabase";
import { fetchSupabasePlacesByTripId } from "@/lib/supabase-places";
import {
  loadTripDetailData,
  saveTripDetailData,
} from "@/lib/trip-detail-storage";
import type { Place } from "@/types/place";

export type PlaceCountStage =
  | "home"
  | "placesTab"
  | "loadDetail"
  | "fetch"
  | "save";

/** 장소 개수 단계별 비교 로그 — 292→291→290 추적 */
export function logPlaceCountPipeline(
  stage: PlaceCountStage,
  tripId: string,
  counts: {
    context?: number | null;
    localStorage?: number | null;
    remote?: number | null;
    merged?: number | null;
    placeCountFinal?: number | null;
    placesTabFinal?: number | null;
    note?: string;
  },
): void {
  const values = [
    counts.context,
    counts.localStorage,
    counts.remote,
    counts.merged,
    counts.placeCountFinal,
    counts.placesTabFinal,
  ].filter((value): value is number => typeof value === "number");

  const min = values.length > 0 ? Math.min(...values) : null;
  const max = values.length > 0 ? Math.max(...values) : null;
  const diverged = min != null && max != null && min !== max;

  console.log(`[placeCount.pipeline][${stage}]`, {
    tripId,
    "1_context": counts.context ?? null,
    "2_localStorage": counts.localStorage ?? null,
    "3_remote": counts.remote ?? null,
    "4_merged": counts.merged ?? null,
    "5_placeCountFinal_home": counts.placeCountFinal ?? null,
    "6_placesTabFinal": counts.placesTabFinal ?? null,
    delta: diverged ? `${min} → ${max}` : "aligned",
    note: counts.note ?? null,
  });
}

/**
 * 홈/로컬 통계용 places — Supabase remote + localStorage merge.
 * 장소 탭(Context merge)과 동일 기준으로 맞춘다.
 */
export async function resolvePlacesForHomeStats(
  tripId: string,
  useSupabase: boolean,
): Promise<{
  places: Place[];
  localCount: number;
  remoteCount: number | null;
  mergedCount: number;
}> {
  const detail = loadTripDetailData(tripId);
  const localCount = detail.places.length;

  if (!useSupabase || !isUuid(tripId)) {
    logPlaceCountPipeline("home", tripId, {
      localStorage: localCount,
      remote: null,
      merged: localCount,
      placeCountFinal: localCount,
      note: "local-only (no supabase)",
    });
    return {
      places: detail.places,
      localCount,
      remoteCount: null,
      mergedCount: localCount,
    };
  }

  try {
    const remotePlaces = await fetchSupabasePlacesByTripId(tripId);
    const mergedPlaces = mergeRemoteAndLocalPlaces(
      remotePlaces,
      detail.places,
    );

    logPlaceCountPipeline("home", tripId, {
      localStorage: localCount,
      remote: remotePlaces.length,
      merged: mergedPlaces.length,
      placeCountFinal: mergedPlaces.length,
      note:
        localCount !== mergedPlaces.length
          ? `localStorage ${localCount} → merged ${mergedPlaces.length} (synced from remote)`
          : "localStorage already matches merge",
    });

    // 홈에서도 LS를 Context/remote 기준으로 write-through → 이후 홈/탭 일치
    if (
      mergedPlaces.length !== detail.places.length ||
      !samePlaceIds(mergedPlaces, detail.places)
    ) {
      saveTripDetailData(tripId, {
        ...detail,
        places: mergedPlaces,
      });
      console.log("[placeCount.pipeline][home.writeThrough]", {
        tripId,
        before: localCount,
        after: mergedPlaces.length,
      });
    }

    return {
      places: mergedPlaces,
      localCount,
      remoteCount: remotePlaces.length,
      mergedCount: mergedPlaces.length,
    };
  } catch (error) {
    console.warn("[placeCount.pipeline][home] remote fetch failed", {
      tripId,
      localCount,
      error,
    });
    logPlaceCountPipeline("home", tripId, {
      localStorage: localCount,
      placeCountFinal: localCount,
      note: "fallback localStorage after remote error",
    });
    return {
      places: detail.places,
      localCount,
      remoteCount: null,
      mergedCount: localCount,
    };
  }
}

function samePlaceIds(a: Place[], b: Place[]): boolean {
  if (a.length !== b.length) return false;
  const ids = new Set(a.map((place) => place.id));
  return b.every((place) => ids.has(place.id));
}

export function logPlacesTabCounts(
  tripId: string,
  contextPlaces: Place[],
): void {
  const localPlaces = loadTripDetailData(tripId).places;
  logPlaceCountPipeline("placesTab", tripId, {
    context: contextPlaces.length,
    localStorage: localPlaces.length,
    placesTabFinal: contextPlaces.length,
    placeCountFinal: undefined,
    note: `visible=${getVisiblePlaces(contextPlaces).length}`,
  });
}
