import type {
  KmlImportResult,
  KmlPlacemark,
  KmlSkipDetail,
} from "@/types/kml";
import type { Place } from "@/types/place";
import { coordinatesToMapsLink } from "@/lib/kml-parser";
import { folderNameToCategory } from "@/lib/kml-folder-map";
import { generatePlaceId, isKmlPlace } from "@/lib/place-utils";

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
    const removalCandidates = nextPlaces.filter((place) => {
      if (!isKmlPlace(place)) return false;
      // 이번 파일에서 매칭된 기존 장소·신규 추가는 유지
      if (matchedExistingKmlIds.has(place.id)) return false;
      if (newPlaceIds.has(place.id)) return false;
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
