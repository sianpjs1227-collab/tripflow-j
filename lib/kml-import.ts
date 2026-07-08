import type { KmlImportResult, KmlPlacemark } from "@/types/kml";
import type { Place } from "@/types/place";
import { coordinatesToMapsLink } from "@/lib/kml-parser";
import { folderNameToCategory } from "@/lib/kml-folder-map";
import { generatePlaceId } from "@/lib/place-utils";

/** KmlPlacemark → Place (Folder → category) */
export function placemarkToPlace(placemark: KmlPlacemark): Place {
  const category = placemark.folderName
    ? folderNameToCategory(placemark.folderName)
    : "other";

  return {
    id: generatePlaceId(),
    name: placemark.name.trim(),
    category,
    latitude: placemark.latitude,
    longitude: placemark.longitude,
    mapsLink: coordinatesToMapsLink(
      placemark.latitude,
      placemark.longitude,
    ),
    memo: placemark.description.trim() || undefined,
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
