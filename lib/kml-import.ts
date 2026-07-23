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
    skippedCount: result.skippedCount,
  });

  if (addedNames.length > 0) {
    console.log(`[KML ${mode}] 신규 추가`);
    for (const name of addedNames) {
      console.log(`- ${name}`);
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
 */
export function updateKmlPlacemarksIntoPlaces(
  existingPlaces: Place[],
  placemarks: KmlPlacemark[],
): KmlImportResult {
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

  const places = existingPlaces.map((place) => {
    const updated = updatesById.get(place.id);
    return updated ?? place;
  });

  const result: KmlImportResult = {
    places: [...places, ...newPlaces],
    addedCount,
    skippedCount,
    updatedCount,
    addedNames,
    skippedDetails,
  };

  logKmlImportResult("update", existingPlaces.length, placemarks.length, result);
  return result;
}
