import type { Place } from "@/types/place";
import {
  getGoogleMapsUrlForPlace,
  getPlaceSearchQuery,
  placeHasStoredCoordinates,
} from "@/lib/place-utils";
import { extractCoordsFromMapsLink } from "@/lib/maps-link-parser";

export interface GeoPosition {
  latitude: number;
  longitude: number;
}

const LOCATION_DENIED_MESSAGE = "현재 위치를 사용할 수 없습니다.";

export { LOCATION_DENIED_MESSAGE };

/** 브라우저에서 현재 위치 조회 */
export function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000,
      },
    );
  });
}

/** Google Maps 링크에서 좌표 추출 (query=lat,lng) */
function parseCoordsFromMapsLink(
  mapsLink: string,
): GeoPosition | null {
  return extractCoordsFromMapsLink(mapsLink);
}

/** Place 에서 목적지 좌표 조회 (저장된 좌표 우선, 링크 파싱 보조) */
export function getPlaceCoordinates(place: Place): GeoPosition | null {
  if (placeHasStoredCoordinates(place)) {
    return { latitude: place.latitude!, longitude: place.longitude! };
  }

  if (place.mapsLink?.trim()) {
    return parseCoordsFromMapsLink(place.mapsLink);
  }

  return null;
}

interface DirectionsTarget {
  latitude?: number;
  longitude?: number;
  name?: string;
}

/** Google Maps 길찾기 URL 생성 */
export function buildDirectionsUrl(
  destination: DirectionsTarget,
  origin?: GeoPosition,
): string | null {
  const hasCoords =
    destination.latitude != null && destination.longitude != null;

  if (!hasCoords && !destination.name?.trim()) return null;

  const params = new URLSearchParams({ api: "1" });

  if (origin) {
    params.set("origin", `${origin.latitude},${origin.longitude}`);
  }

  if (hasCoords) {
    params.set(
      "destination",
      `${destination.latitude},${destination.longitude}`,
    );
  } else if (destination.name) {
    params.set("destination", destination.name.trim());
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function openUrl(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * 현재 위치 → 장소 길찾기
 * 위치 권한 거부 시 안내 후 기존 Google Maps 화면으로 fallback
 */
export async function openDirectionsToPlace(
  place: Place,
  knownOrigin?: GeoPosition,
): Promise<void> {
  const fallbackUrl = getGoogleMapsUrlForPlace(place);
  const coords = getPlaceCoordinates(place);
  const searchQuery = getPlaceSearchQuery(place);
  const destination: DirectionsTarget = {
    latitude: coords?.latitude,
    longitude: coords?.longitude,
    name: searchQuery || place.name.trim() || undefined,
  };

  if (!coords && !destination.name) {
    if (fallbackUrl) openUrl(fallbackUrl);
    return;
  }

  try {
    const current = knownOrigin ?? (await getCurrentPosition());
    const directionsUrl = buildDirectionsUrl(destination, current);

    if (directionsUrl) {
      openUrl(directionsUrl);
      return;
    }
  } catch {
    if (!knownOrigin) {
      window.alert(LOCATION_DENIED_MESSAGE);
    }
  }

  if (fallbackUrl) {
    openUrl(fallbackUrl);
  }
}
