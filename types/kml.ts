import type { Place } from "@/types/place";

/** KML Placemark 에서 추출한 데이터 */
export interface KmlPlacemark {
  name: string;
  description: string;
  longitude: number;
  latitude: number;
  /** 속한 KML Folder 이름 */
  folderName?: string;
}

export interface KmlParseResult {
  placemarks: KmlPlacemark[];
  errors: string[];
}

export interface KmlImportResult {
  places: Place[];
  addedCount: number;
  skippedCount: number;
  updatedCount?: number;
}
