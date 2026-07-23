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

/** KML update/merge 시 건너뛴 장소 사유 */
export type KmlSkipReason =
  | "existing_kml"
  | "existing_manual"
  | "duplicate_in_kml"
  | "empty_name";

export interface KmlSkipDetail {
  name: string;
  reason: KmlSkipReason;
}

export interface KmlImportResult {
  places: Place[];
  addedCount: number;
  skippedCount: number;
  updatedCount?: number;
  /** 이번 import에서 새로 추가된 장소명 */
  addedNames?: string[];
  /** 건너뛴 장소명 + 이유 */
  skippedDetails?: KmlSkipDetail[];
}
