import type {
  KmlImportResult,
  KmlPlacemark,
  KmlSkipDetail,
} from "@/types/kml";
import type { Place } from "@/types/place";
import { coordinatesToMapsLink } from "@/lib/kml-parser";
import { folderNameToCategory } from "@/lib/kml-folder-map";
import {
  generatePlaceId,
  inferPlaceSource,
  isKmlPlace,
  placeHasStoredCoordinates,
} from "@/lib/place-utils";

/** 진단용 — Place 에 없는 kmlPlaceId/kmlFolder 는 null 로 표기 */
function placeDeleteDebugFields(place: Place) {
  return {
    placeId: place.id,
    name: place.name,
    source: place.source ?? null,
    inferredSource: inferPlaceSource(place),
    isKmlPlace: isKmlPlace(place),
    kmlPlaceId: null as string | null, // Place 모델에 필드 없음 — 이름 매칭만 사용
    kmlFolder: null as string | null, // Place 모델에 필드 없음 — import 시 category 로만 반영
    hidden: place.hidden === true,
    category: place.category,
    hasCoordinates: placeHasStoredCoordinates(place),
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
  };
}

type DeleteSkipReason =
  | "not_kml_place"
  | "matched_existing_in_this_kml"
  | "newly_added_in_this_kml"
  | "would_delete";

/** KmlPlacemark → Place (Folder → category) */
export function placemarkToPlace(placemark: KmlPlacemark): Place {
  const category = placemark.folderName
    ? folderNameToCategory(placemark.folderName)
    : "other";

  return {
    id: generatePlaceId(),
    name: placemark.name.trim(),
    category,
    source: "KML",
    latitude: placemark.latitude,
    longitude: placemark.longitude,
    mapsLink: coordinatesToMapsLink(
      placemark.latitude,
      placemark.longitude,
    ),
    memo: placemark.description.trim() || undefined,
  };
}

/** 기존 KML에서 가져온 장소가 있는지 확인 */
export function hasExistingKmlPlaces(places: Place[]): boolean {
  return places.some((place) => isKmlPlace(place));
}

function applyPlacemarkToExistingKmlPlace(
  existing: Place,
  placemark: KmlPlacemark,
): Place {
  const fresh = placemarkToPlace(placemark);

  return {
    ...existing,
    id: existing.id,
    source: "KML",
    name: fresh.name,
    category: fresh.category,
    latitude: fresh.latitude,
    longitude: fresh.longitude,
    mapsLink: fresh.mapsLink,
    memo: existing.memo?.trim() ? existing.memo : fresh.memo,
    // 사용자가 TripFlow에서 숨긴 My Maps 장소는 재가져오기 후에도 숨김 유지
    hidden: existing.hidden,
  };
}

function logKmlImportResult(
  mode: "merge" | "update",
  existingCount: number,
  kmlCount: number,
  result: KmlImportResult,
): void {
  const skippedDetails = result.skippedDetails ?? [];
  const addedNames = result.addedNames ?? [];

  console.log(`[KML ${mode}] summary`, {
    existingCount,
    kmlCount,
    updatedCount: result.updatedCount ?? 0,
    addedCount: result.addedCount,
    deletedCount: result.deletedCount ?? 0,
    skippedCount: result.skippedCount,
  });

  if (addedNames.length > 0) {
    console.log(`[KML ${mode}] 신규 추가`);
    for (const name of addedNames) {
      console.log(`- ${name}`);
    }
  }

  if ((result.deletedNames?.length ?? 0) > 0) {
    console.log(`[KML ${mode}] 삭제`, {
      deletedCount: result.deletedCount ?? 0,
      deletedIds: result.deletedIds ?? [],
      deletedNames: result.deletedNames ?? [],
    });
    for (let i = 0; i < (result.deletedNames?.length ?? 0); i += 1) {
      console.log(
        `- ${result.deletedNames![i]} (${result.deletedIds?.[i] ?? "?"})`,
      );
    }
  }

  if (skippedDetails.length > 0) {
    console.log(`[KML ${mode}] Skip`);
    for (const detail of skippedDetails) {
      console.log(`- ${detail.name}`);
      console.log(`reason: ${detail.reason}`);
    }
  }
}

export function mergeKmlPlacemarksIntoPlaces(
  existingPlaces: Place[],
  placemarks: KmlPlacemark[],
): KmlImportResult {
  const kmlNames = new Set(
    existingPlaces
      .filter((place) => isKmlPlace(place))
      .map((place) => place.name.trim())
      .filter(Boolean),
  );
  const manualNames = new Set(
    existingPlaces
      .filter((place) => !isKmlPlace(place))
      .map((place) => place.name.trim())
      .filter(Boolean),
  );
  const existingNames = new Set([...kmlNames, ...manualNames]);

  const newPlaces: Place[] = [];
  const addedNames: string[] = [];
  const skippedDetails: KmlSkipDetail[] = [];
  let skippedCount = 0;

  for (const placemark of placemarks) {
    const name = placemark.name.trim();
    if (!name) {
      skippedCount += 1;
      skippedDetails.push({ name: "(empty)", reason: "empty_name" });
      continue;
    }

    if (existingNames.has(name)) {
      skippedCount += 1;
      skippedDetails.push({
        name,
        reason: kmlNames.has(name) ? "existing_kml" : "existing_manual",
      });
      continue;
    }

    const place = placemarkToPlace(placemark);
    newPlaces.push(place);
    existingNames.add(name);
    kmlNames.add(name);
    addedNames.push(name);
  }

  const result: KmlImportResult = {
    places: [...existingPlaces, ...newPlaces],
    addedCount: newPlaces.length,
    skippedCount,
    addedNames,
    skippedDetails,
  };

  logKmlImportResult("merge", existingPlaces.length, placemarks.length, result);
  return result;
}

/**
 * KML 재가져오기 — KML 장소는 최신 데이터로 갱신, MANUAL 장소·연결 데이터 유지
 *
 * 신규 추가 규칙:
 * - 동일 이름의 기존 KML 장소가 있으면 → update
 * - 없으면 → 항상 add (MANUAL 동명이 있어도 My Maps 신규는 추가)
 * - 같은 KML 파일 안 동명 반복 → 첫 항목만 반영, 나머지 skip
 *
 * removeMissingKmlPlaces=true 이면:
 * - source=KML 이면서 현재 KML에 없는 장소만 삭제
 * - MANUAL 장소는 절대 삭제하지 않음
 */
export function updateKmlPlacemarksIntoPlaces(
  existingPlaces: Place[],
  placemarks: KmlPlacemark[],
  options?: { removeMissingKmlPlaces?: boolean },
): KmlImportResult {
  const removeMissing = options?.removeMissingKmlPlaces === true;

  const kmlByName = new Map<string, Place>();
  for (const place of existingPlaces) {
    if (!isKmlPlace(place)) continue;
    const name = place.name.trim();
    if (!name || kmlByName.has(name)) continue;
    kmlByName.set(name, place);
  }

  const manualNames = new Set(
    existingPlaces
      .filter((place) => !isKmlPlace(place))
      .map((place) => place.name.trim())
      .filter(Boolean),
  );

  const updatesById = new Map<string, Place>();
  /** 이번 KML 파일에서 매칭되어 유지/갱신된 기존 KML place id */
  const matchedExistingKmlIds = new Set<string>();
  const newPlaces: Place[] = [];
  const addedNames: string[] = [];
  const skippedDetails: KmlSkipDetail[] = [];
  const seenInThisFile = new Set<string>();

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const placemark of placemarks) {
    const name = placemark.name.trim();

    if (!name) {
      skippedCount += 1;
      skippedDetails.push({ name: "(empty)", reason: "empty_name" });
      continue;
    }

    // 같은 KML 파일 내 동명 → 첫 항목만 처리
    if (seenInThisFile.has(name)) {
      skippedCount += 1;
      skippedDetails.push({ name, reason: "duplicate_in_kml" });
      continue;
    }
    seenInThisFile.add(name);

    const existingKml = kmlByName.get(name);

    if (existingKml) {
      matchedExistingKmlIds.add(existingKml.id);
      updatesById.set(
        existingKml.id,
        applyPlacemarkToExistingKmlPlace(existingKml, placemark),
      );
      updatedCount += 1;
      continue;
    }

    // 기존 KML에 없는 이름 → 신규 추가
    // (이전 버그: allNames에 MANUAL 이름까지 넣어 신규 My Maps 장소를 조용히 버림)
    const place = placemarkToPlace(placemark);
    newPlaces.push(place);
    kmlByName.set(name, place);
    addedNames.push(name);
    addedCount += 1;

    if (manualNames.has(name)) {
      console.log("[KML update] 신규 추가 (MANUAL 동명 존재, KML로 별도 추가)", {
        name,
      });
    }
  }

  const newPlaceIds = new Set(newPlaces.map((place) => place.id));

  const places = existingPlaces.map((place) => {
    const updated = updatesById.get(place.id);
    return updated ?? place;
  });

  let nextPlaces = [...places, ...newPlaces];
  const deletedNames: string[] = [];
  const deletedIds: string[] = [];

  if (removeMissing) {
    const beforeCount = nextPlaces.length;

    console.log("[KML update] delete selection rules", {
      removeMissing,
      criteria: [
        "1. isKmlPlace(place) === true  (source==='KML' OR inferred from coordinates; NOT source==='kml' lowercase; NOT kmlPlaceId)",
        "2. place.id NOT in matchedExistingKmlIds (name matched a placemark in this KML → keep/update)",
        "3. place.id NOT in newPlaceIds (added from this KML → keep)",
        "4. MANUAL places are never deleted",
        "5. matching key = trimmed place.name only (no kmlPlaceId / kmlFolder on Place)",
      ],
      matchedByNameCount: matchedExistingKmlIds.size,
      seenInThisFileNames: [...seenInThisFile],
      newPlaceIds: [...newPlaceIds],
    });

    // 기존 장소(특히 숙소) 필드 스냅샷
    console.log(
      "[KML update] existing places snapshot (source / kmlPlaceId / hidden / category)",
    );
    for (const place of existingPlaces) {
      const fields = placeDeleteDebugFields(place);
      if (
        fields.category === "accommodation" ||
        fields.isKmlPlace ||
        /숙소/i.test(fields.name)
      ) {
        console.log("[KML update] place.debug", fields);
      }
    }

    const exclusionLog: Array<{
      placeId: string;
      name: string;
      reason: DeleteSkipReason;
      detail: string;
      fields: ReturnType<typeof placeDeleteDebugFields>;
    }> = [];

    const removalCandidates = nextPlaces.filter((place) => {
      const fields = placeDeleteDebugFields(place);

      if (!isKmlPlace(place)) {
        exclusionLog.push({
          placeId: place.id,
          name: place.name,
          reason: "not_kml_place",
          detail: `inferredSource=${fields.inferredSource}, source=${String(fields.source)}, hasCoordinates=${fields.hasCoordinates}. Delete targets only isKmlPlace===true (source KML or coords). Not kmlPlaceId.`,
          fields,
        });
        return false;
      }

      if (matchedExistingKmlIds.has(place.id)) {
        exclusionLog.push({
          placeId: place.id,
          name: place.name,
          reason: "matched_existing_in_this_kml",
          detail: `name "${place.name.trim()}" is still present in this KML (seenInThisFile) → treated as UPDATE, not delete`,
          fields,
        });
        return false;
      }

      if (newPlaceIds.has(place.id)) {
        exclusionLog.push({
          placeId: place.id,
          name: place.name,
          reason: "newly_added_in_this_kml",
          detail: "added in this import — keep",
          fields,
        });
        return false;
      }

      exclusionLog.push({
        placeId: place.id,
        name: place.name,
        reason: "would_delete",
        detail: "KML place with no name match in this file → delete candidate",
        fields,
      });
      return true;
    });

    console.log("[KML update] delete candidates", {
      removeMissing,
      candidateCount: removalCandidates.length,
      deletedIds: removalCandidates.map((place) => place.id),
      deletedNames: removalCandidates.map((place) => place.name),
      matchedExistingKmlIds: [...matchedExistingKmlIds],
      newPlaceIds: [...newPlaceIds],
      seenInThisFileCount: seenInThisFile.size,
    });

    console.log("[KML update] delete exclusion reasons (per place)", {
      total: exclusionLog.length,
      wouldDelete: exclusionLog.filter((row) => row.reason === "would_delete")
        .length,
      skippedNotKml: exclusionLog.filter(
        (row) => row.reason === "not_kml_place",
      ).length,
      skippedMatched: exclusionLog.filter(
        (row) => row.reason === "matched_existing_in_this_kml",
      ).length,
      skippedNew: exclusionLog.filter(
        (row) => row.reason === "newly_added_in_this_kml",
      ).length,
    });

    for (const row of exclusionLog) {
      if (row.reason === "would_delete") continue;

      const isLodgingLike =
        row.fields.category === "accommodation" || /숙소/i.test(row.name);

      // 전체 MANUAL 스팸 방지: not_kml 은 숙소류만, matched 는 숙소류 + 이름에 숙소
      if (row.reason === "not_kml_place" && !isLodgingLike) continue;
      if (
        row.reason === "matched_existing_in_this_kml" &&
        !isLodgingLike
      ) {
        // 매칭으로 살아남은 숙소만 상세 — 나머지는 summary 에 포함
        continue;
      }

      console.log("[KML update] NOT in deleteCandidates", {
        reason: row.reason,
        detail: row.detail,
        ...row.fields,
      });
    }

    // 매칭되어 삭제에서 제외된 KML 전체 요약 (숙소 외 포함)
    const matchedKept = exclusionLog.filter(
      (row) => row.reason === "matched_existing_in_this_kml",
    );
    console.log("[KML update] kept by name match (not deleted)", {
      count: matchedKept.length,
      sample: matchedKept.slice(0, 20).map((row) => ({
        placeId: row.placeId,
        name: row.name,
        category: row.fields.category,
      })),
    });

    nextPlaces = nextPlaces.filter((place) => {
      if (!isKmlPlace(place)) return true;
      if (matchedExistingKmlIds.has(place.id)) return true;
      if (newPlaceIds.has(place.id)) return true;
      deletedIds.push(place.id);
      deletedNames.push(place.name.trim() || place.id);
      return false;
    });

    const stillPresent = deletedIds.filter((id) =>
      nextPlaces.some((place) => place.id === id),
    );

    console.log("[KML update] delete applied to places array", {
      beforeCount,
      afterCount: nextPlaces.length,
      deletedCount: deletedIds.length,
      deletedIds,
      deletedNames,
      stillPresentInFinalPlaces: stillPresent,
      excludedOk: stillPresent.length === 0,
    });
  }

  const result: KmlImportResult = {
    places: nextPlaces,
    addedCount,
    skippedCount,
    updatedCount,
    deletedCount: deletedIds.length,
    addedNames,
    deletedNames,
    deletedIds,
    skippedDetails,
  };

  console.log("[KML update] final places for updateData", {
    placesLength: result.places.length,
    existingCount: existingPlaces.length,
    delta: result.places.length - existingPlaces.length,
    deletedIds: result.deletedIds ?? [],
  });

  logKmlImportResult("update", existingPlaces.length, placemarks.length, result);
  return result;
}
