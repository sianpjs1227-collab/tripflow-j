import {
  loadTripDetailData,
  saveTripDetailData,
} from "@/lib/trip-detail-storage";
import { mergeRemoteAndLocalPlaces } from "@/lib/place-merge";
import { getPendingPlaceDeletions } from "@/lib/place-pending-deletes";
import {
  logDeleteTrace,
  logDeleteTraceFinalSuccess,
} from "@/lib/place-delete-trace";
import { getVisiblePlaces } from "@/lib/place-utils";
import { isUuid } from "@/lib/supabase";
import { fetchSupabasePlacesByTripId } from "@/lib/supabase-places";
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

function placeCountSnapshot(places: Place[]) {
  return places.map((place) => ({
    id: place.id,
    name: place.name,
    hidden: place.hidden === true,
    source: place.source ?? null,
  }));
}

function diffPlacesById(
  left: Place[],
  right: Place[],
): { onlyLeft: Place[]; onlyRight: Place[] } {
  const rightIds = new Set(right.map((place) => place.id));
  const leftIds = new Set(left.map((place) => place.id));
  return {
    onlyLeft: left.filter((place) => !rightIds.has(place.id)),
    onlyRight: right.filter((place) => !leftIds.has(place.id)),
  };
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

  console.log("[placeCount.path][home] start", {
    tripId,
    path: "useTripHomeStats → getTripHomeStatsAsync → resolvePlacesForHomeStats → placeCount=mergedCount|localCount",
    localStorageCount: localCount,
    filtersApplied: "none (raw places.length — NO getVisiblePlaces / hidden / dedupe)",
    snapshot: placeCountSnapshot(detail.places),
  });

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
    logDeleteTrace("home.fetchSupabasePlacesByTripId", tripId, remotePlaces);

    const mergedPlaces = mergeRemoteAndLocalPlaces(
      remotePlaces,
      detail.places,
    );
    logDeleteTrace("home.mergeRemoteAndLocalPlaces", tripId, mergedPlaces);

    const pendingDeletes = getPendingPlaceDeletions();
    const localIds = new Set(detail.places.map((place) => place.id));
    const remoteOnlyAdded = mergedPlaces.filter(
      (place) => !localIds.has(place.id),
    );

    const localVsMerged = diffPlacesById(detail.places, mergedPlaces);
    console.log("[placeCount.diff][home.local_vs_merged]", {
      tripId,
      localCount,
      remoteCount: remotePlaces.length,
      mergedCount: mergedPlaces.length,
      onlyInLocalStorage: placeCountSnapshot(localVsMerged.onlyLeft),
      onlyInMerged: placeCountSnapshot(localVsMerged.onlyRight),
      pendingDeletes,
    });

    console.log("[places.delete.persist][home.entry]", {
      tripId,
      loadTripDetailData: localCount,
      fetchSupabasePlacesByTripId: remotePlaces.length,
      merged: mergedPlaces.length,
      pendingDeletes,
      remoteOnlyAddedIds: remoteOnlyAdded.map((place) => place.id),
      remoteOnlyAddedNames: remoteOnlyAdded.map((place) => place.name),
    });

    // 홈 writeThrough 가 remote 의 아직-삭제-안-된 행으로 LS/화면을 되돌리지 않게:
    // local 이 비어 있지 않은데 merge 가 더 커지면(= remote-only 추가) 절대 LS에 쓰지 않음
    const wouldExpand =
      detail.places.length > 0 &&
      mergedPlaces.length > detail.places.length;

    if (wouldExpand || (detail.places.length > 0 && remoteOnlyAdded.length > 0)) {
      console.warn("[places.delete.persist][home.writeThrough.skip]", {
        tripId,
        reason:
          "refuse to expand localStorage from remote-only places (prevents delete resurrection while sync in flight)",
        before: localCount,
        merged: mergedPlaces.length,
        remoteOnlyAddedIds: remoteOnlyAdded.map((place) => place.id),
        remoteOnlyAddedNames: remoteOnlyAdded.map((place) => place.name),
        pendingDeletes,
      });
      logDeleteTrace("home.writeThrough.SKIP_expand", tripId, detail.places, {
        remoteOnlyAddedNames: remoteOnlyAdded.map((place) => place.name),
        mergedHadWatched: mergedPlaces.length !== detail.places.length,
      });

      console.log("[placeCount.path][home] final", {
        tripId,
        placeCount: detail.places.length,
        source: "localStorage (expand skipped — not merged)",
        snapshot: placeCountSnapshot(detail.places),
      });
      logPlaceCountPipeline("home", tripId, {
        localStorage: localCount,
        remote: remotePlaces.length,
        merged: mergedPlaces.length,
        placeCountFinal: detail.places.length,
        note: "placeCount=localStorage because expand skipped",
      });

      return {
        places: detail.places,
        localCount,
        remoteCount: remotePlaces.length,
        mergedCount: detail.places.length,
      };
    }

    if (
      mergedPlaces.length !== detail.places.length ||
      !samePlaceIds(mergedPlaces, detail.places)
    ) {
      logDeleteTrace("home.writeThrough.BEFORE_save", tripId, mergedPlaces, {
        beforeLocal: localCount,
        afterMerged: mergedPlaces.length,
      });
      saveTripDetailData(tripId, {
        ...detail,
        places: mergedPlaces,
      });
      console.log("[placeCount.pipeline][home.writeThrough]", {
        tripId,
        before: localCount,
        after: mergedPlaces.length,
      });
      logDeleteTrace(
        "home.writeThrough.AFTER_save",
        tripId,
        loadTripDetailData(tripId).places,
      );
    }

    logDeleteTraceFinalSuccess(tripId, "home.resolvePlaces", mergedPlaces);

    console.log("[placeCount.path][home] final", {
      tripId,
      placeCount: mergedPlaces.length,
      source: "merged(remote+localStorage)",
      snapshot: placeCountSnapshot(mergedPlaces),
    });
    logPlaceCountPipeline("home", tripId, {
      localStorage: localCount,
      remote: remotePlaces.length,
      merged: mergedPlaces.length,
      placeCountFinal: mergedPlaces.length,
      note:
        localCount !== mergedPlaces.length
          ? `localStorage ${localCount} → merged ${mergedPlaces.length}`
          : "localStorage already matches merge",
    });

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

/**
 * PlacesTab(Context) vs localStorage vs Home resolve 개수/구성 비교.
 * PlacesTab에만 있는 place 를 찾아 출력한다.
 */
export function logPlacesTabCounts(
  tripId: string,
  contextPlaces: Place[],
): void {
  const localPlaces = loadTripDetailData(tripId).places;
  const visible = getVisiblePlaces(contextPlaces);
  const hiddenPlaces = contextPlaces.filter((place) => place.hidden === true);
  const ctxVsLs = diffPlacesById(contextPlaces, localPlaces);

  console.log("[placeCount.path][placesTab]", {
    tripId,
    path: "TripDetailContext.data.places (raw length for pipeline; UI list uses getVisiblePlaces)",
    contextCount: contextPlaces.length,
    visibleCount: visible.length,
    hiddenCount: hiddenPlaces.length,
    localStorageCount: localPlaces.length,
    filtersOnContextRaw: "none for Context.length",
    filtersOnVisibleList: "getVisiblePlaces → hidden!==true",
    snapshot: placeCountSnapshot(contextPlaces),
  });

  console.log("[placeCount.diff][context_vs_localStorage]", {
    tripId,
    context: contextPlaces.length,
    localStorage: localPlaces.length,
    onlyInContext_notInLocalStorage: placeCountSnapshot(ctxVsLs.onlyLeft),
    onlyInLocalStorage_notInContext: placeCountSnapshot(ctxVsLs.onlyRight),
    hiddenInContext: placeCountSnapshot(hiddenPlaces),
  });

  logPlaceCountPipeline("placesTab", tripId, {
    context: contextPlaces.length,
    localStorage: localPlaces.length,
    placesTabFinal: contextPlaces.length,
    placeCountFinal: undefined,
    note: `visible=${visible.length} hidden=${hiddenPlaces.length}`,
  });

  // Context 가 LS 보다 앞선 경우(신규 1개 등) Home 이 뒤처지지 않게 LS 정렬
  if (
    ctxVsLs.onlyLeft.length > 0 &&
    ctxVsLs.onlyRight.length === 0 &&
    contextPlaces.length > localPlaces.length
  ) {
    console.warn("[placeCount.align][context_ahead_of_localStorage]", {
      tripId,
      missingFromLocalStorage: placeCountSnapshot(ctxVsLs.onlyLeft),
      note: "writing Context places to localStorage so Home placeCount can catch up",
    });
    const detail = loadTripDetailData(tripId);
    saveTripDetailData(tripId, { ...detail, places: contextPlaces });
  }

  void resolvePlacesForHomeStats(tripId, isUuid(tripId)).then((resolved) => {
    const ctxVsHome = diffPlacesById(contextPlaces, resolved.places);
    console.log("[placeCount.diff][PlacesTab_vs_Home]", {
      tripId,
      t: new Date().toISOString(),
      contextPlacesLength: contextPlaces.length,
      homePlacesLength: resolved.places.length,
      homePlaceCount: resolved.mergedCount,
      homeSourceCounts: {
        localStorage: resolved.localCount,
        remote: resolved.remoteCount,
        mergedCount: resolved.mergedCount,
      },
      /** PlacesTab(Context)에는 있지만 Home placeCount 소스에는 없는 place */
      onlyInPlacesTab_notInHome: placeCountSnapshot(ctxVsHome.onlyLeft),
      /** Home에는 있지만 PlacesTab Context에는 없는 place */
      onlyInHome_notInPlacesTab: placeCountSnapshot(ctxVsHome.onlyRight),
      homeSnapshot: placeCountSnapshot(resolved.places),
    });

    if (ctxVsHome.onlyLeft.length > 0) {
      console.warn(
        "[placeCount.diff] ★ PlacesTab only (missing from Home)",
        ctxVsHome.onlyLeft.map((place) => ({
          placeId: place.id,
          name: place.name,
          hidden: place.hidden === true,
          source: place.source ?? null,
        })),
      );
    }
  });
}
