import { mergeRemoteAndLocalPlaces } from "@/lib/place-merge";
import { getPendingPlaceDeletions } from "@/lib/place-pending-deletes";
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
    const pendingDeletes = getPendingPlaceDeletions();
    const localIds = new Set(detail.places.map((place) => place.id));
    const remoteOnlyAdded = mergedPlaces.filter(
      (place) => !localIds.has(place.id),
    );

    console.log("[places.delete.persist][home.entry]", {
      tripId,
      loadTripDetailData: localCount,
      fetchSupabasePlacesByTripId: remotePlaces.length,
      merged: mergedPlaces.length,
      pendingDeletes,
      remoteOnlyAddedIds: remoteOnlyAdded.map((place) => place.id),
      remoteOnlyAddedNames: remoteOnlyAdded.map((place) => place.name),
    });

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

    // 홈 writeThrough 가 삭제된 장소를 다시 LS에 넣지 않도록:
    // local 비어있지 한데 merge 가 remote-only 를 추가하면 skip
    // (pending delete tombstone 이 있으면 merge 가 이미 걸러야 함)
    const wouldResurrect =
      detail.places.length > 0 && remoteOnlyAdded.length > 0;

    if (wouldResurrect) {
      console.warn("[places.delete.persist][home.writeThrough.skip]", {
        tripId,
        reason:
          "merge would add remote-only places into localStorage (possible delete resurrection)",
        before: localCount,
        merged: mergedPlaces.length,
        remoteOnlyAddedIds: remoteOnlyAdded.map((place) => place.id),
        pendingDeletes,
      });
      // 통계는 local(삭제 반영) 우선 — Context/ tombstone 과 맞춤
      const safePlaces =
        pendingDeletes.length > 0 ? detail.places : mergedPlaces;
      return {
        places: safePlaces,
        localCount,
        remoteCount: remotePlaces.length,
        mergedCount: safePlaces.length,
      };
    }

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
