import type { Place } from "@/types/place";
import type { ScheduleInput, ScheduleItem } from "@/types/schedule";
import {
  getGoogleMapsUrlForPlace,
  openGoogleMapsForPlace,
} from "@/lib/place-utils";
import {
  getPlaceCoordinates,
  openDirectionsToPlace,
  type GeoPosition,
} from "@/lib/directions";
import { scheduleItemToPlace } from "@/lib/schedule-maps";

/** MapPreview 입력 — 장소명·좌표 */
export interface MapPreviewLocation {
  name: string;
  latitude: number;
  longitude: number;
  mapsLink?: string;
  address?: string;
}

/** MapPreview Sheet 상태 */
export interface MapPreviewState {
  location: MapPreviewLocation | null;
  title: string;
  actionsSource: Place;
  /** 빈 시간 추천 등 — 일정 추가 모달 기본값 */
  schedulePrefill?: Partial<ScheduleInput>;
  /** 내 주변·빈 시간 추천 등 미리 계산된 거리 */
  distanceMeters?: number;
  walkingMinutes?: number;
}

export interface OpenMapPreviewOptions {
  schedulePrefill?: Partial<ScheduleInput>;
  distanceMeters?: number;
  walkingMinutes?: number;
}

export function mapPreviewToPlace(location: MapPreviewLocation): Place {
  return {
    id: "map-preview",
    name: location.name,
    category: "other",
    latitude: location.latitude,
    longitude: location.longitude,
    mapsLink: location.mapsLink,
    address: location.address,
  };
}

export function placeToMapPreviewLocation(
  place: Place,
): MapPreviewLocation | null {
  const coords = getPlaceCoordinates(place);
  if (!coords) return null;

  return {
    name: place.name,
    latitude: coords.latitude,
    longitude: coords.longitude,
    mapsLink: place.mapsLink,
    address: place.address,
  };
}

export function scheduleItemToMapPreviewLocation(
  item: ScheduleItem,
): MapPreviewLocation | null {
  return placeToMapPreviewLocation(scheduleItemToPlace(item));
}

export function createMapPreviewStateFromPlace(
  place: Place,
  options?: OpenMapPreviewOptions,
): MapPreviewState {
  return {
    location: placeToMapPreviewLocation(place),
    title: place.name,
    actionsSource: place,
    schedulePrefill: options?.schedulePrefill,
    distanceMeters: options?.distanceMeters,
    walkingMinutes: options?.walkingMinutes,
  };
}

export function createMapPreviewState(
  location: MapPreviewLocation,
): MapPreviewState {
  return {
    location,
    title: location.name,
    actionsSource: mapPreviewToPlace(location),
  };
}

export function getGoogleMapsUrlForLocation(
  location: MapPreviewLocation,
): string | null {
  return getGoogleMapsUrlForPlace(mapPreviewToPlace(location));
}

export function openGoogleMapsForLocation(
  location: MapPreviewLocation,
): void {
  openGoogleMapsForPlace(mapPreviewToPlace(location));
}

export function openDirectionsForLocation(
  location: MapPreviewLocation,
  currentPosition?: GeoPosition,
): void {
  void openDirectionsToPlace(mapPreviewToPlace(location), currentPosition);
}

export function openGoogleMapsForPreviewState(state: MapPreviewState): void {
  openGoogleMapsForPlace(state.actionsSource);
}

export function openDirectionsForPreviewState(
  state: MapPreviewState,
  currentPosition?: GeoPosition,
): void {
  void openDirectionsToPlace(state.actionsSource, currentPosition);
}

export function previewStateHasGoogleMaps(state: MapPreviewState): boolean {
  return Boolean(getGoogleMapsUrlForPlace(state.actionsSource));
}

/** 즐겨찾기·일정추가 가능한 저장된 장소인지 */
export function previewStateHasPlaceActions(state: MapPreviewState): boolean {
  return Boolean(state.actionsSource.id && state.actionsSource.id !== "map-preview");
}
