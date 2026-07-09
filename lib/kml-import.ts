import type { KmlImportResult, KmlPlacemark } from "@/types/kml";
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
  };
}

export function mergeKmlPlacemarksIntoPlaces(
  existingPlaces: Place[],
  placemarks: KmlPlacemark[],
): KmlImportResult {
  const existingNames = new Set(
    existingPlaces.map((p) => p.name.trim()),
  );

  const newPlaces: Place[] = [];
  let skippedCount = 0;

  for (const placemark of placemarks) {
    const name = placemark.name.trim();
    if (existingNames.has(name)) {
      skippedCount += 1;
      continue;
    }

    const place = placemarkToPlace(placemark);
    newPlaces.push(place);
    existingNames.add(name);
  }

  return {
    places: [...existingPlaces, ...newPlaces],
    addedCount: newPlaces.length,
    skippedCount,
  };
}

/**
 * KML 재가져오기 — KML 장소는 최신 데이터로 갱신, MANUAL 장소·연결 데이터 유지
 */
export function updateKmlPlacemarksIntoPlaces(
  existingPlaces: Place[],
  placemarks: KmlPlacemark[],
): KmlImportResult {
  const kmlByName = new Map(
    existingPlaces
      .filter((place) => isKmlPlace(place))
      .map((place) => [place.name.trim(), place]),
  );
  const allNames = new Set(existingPlaces.map((place) => place.name.trim()));

  const updatesById = new Map<string, Place>();
  const newPlaces: Place[] = [];
  let addedCount = 0;
  let updatedCount = 0;

  for (const placemark of placemarks) {
    const name = placemark.name.trim();
    const existingKml = kmlByName.get(name);

    if (existingKml) {
      updatesById.set(
        existingKml.id,
        applyPlacemarkToExistingKmlPlace(existingKml, placemark),
      );
      updatedCount += 1;
    } else if (!allNames.has(name)) {
      const place = placemarkToPlace(placemark);
      newPlaces.push(place);
      allNames.add(name);
      addedCount += 1;
    }
  }

  const places = existingPlaces.map((place) => {
    const updated = updatesById.get(place.id);
    return updated ?? place;
  });

  return {
    places: [...places, ...newPlaces],
    addedCount,
    skippedCount: 0,
    updatedCount,
  };
}

/**
 * My Maps 동기화 — KML 갱신 + KML에 없는 장소 삭제
 * MANUAL 장소·일정 연결은 유지
 */
export function syncKmlPlacemarksIntoPlaces(
  existingPlaces: Place[],
  placemarks: KmlPlacemark[],
): KmlImportResult {
  const placemarkNames = new Set(placemarks.map((p) => p.name.trim()));
  const updateResult = updateKmlPlacemarksIntoPlaces(existingPlaces, placemarks);

  let deletedCount = 0;
  const places = updateResult.places.filter((place) => {
    if (!isKmlPlace(place)) return true;
    if (placemarkNames.has(place.name.trim())) return true;
    deletedCount += 1;
    return false;
  });

  return {
    places,
    addedCount: updateResult.addedCount,
    skippedCount: 0,
    updatedCount: updateResult.updatedCount,
    deletedCount,
  };
}
