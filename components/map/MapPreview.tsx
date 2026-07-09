"use client";

import { useEffect, useRef } from "react";
import type { GeoPosition } from "@/lib/directions";
import { Text } from "@/components/ui";
import "leaflet/dist/leaflet.css";

const PRIMARY_MARKER_COLOR = "#3B82F6";
const SUCCESS_MARKER_COLOR = "#22C55E";

interface MapPreviewProps {
  name: string;
  latitude: number;
  longitude: number;
  currentPosition?: GeoPosition | null;
  locationLoading?: boolean;
}

/** Leaflet + OpenStreetMap 미니맵 */
export default function MapPreview({
  name,
  latitude,
  longitude,
  currentPosition,
  locationLoading = false,
}: MapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      mapRef.current?.remove();
      mapRef.current = null;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const placeLatLng: [number, number] = [latitude, longitude];

      L.circleMarker(placeLatLng, {
        radius: 10,
        color: "#ffffff",
        weight: 2,
        fillColor: PRIMARY_MARKER_COLOR,
        fillOpacity: 1,
      })
        .addTo(map)
        .bindTooltip(name, { direction: "top", offset: [0, -4] });

      const bounds = L.latLngBounds([placeLatLng]);

      if (currentPosition) {
        const userLatLng: [number, number] = [
          currentPosition.latitude,
          currentPosition.longitude,
        ];

        L.circleMarker(userLatLng, {
          radius: 8,
          color: "#ffffff",
          weight: 2,
          fillColor: SUCCESS_MARKER_COLOR,
          fillOpacity: 1,
        })
          .addTo(map)
          .bindTooltip("현재 위치", { direction: "top", offset: [0, -4] });

        bounds.extend(userLatLng);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 });
      } else {
        map.setView(placeLatLng, 15);
      }

      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    };

    void initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [
    latitude,
    longitude,
    name,
    currentPosition?.latitude,
    currentPosition?.longitude,
  ]);

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="h-56 w-full overflow-hidden rounded-2xl border border-border [&_.leaflet-control-attribution]:text-[10px]"
        aria-label={`${name} 지도`}
        role="img"
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Text variant="caption" as="span" className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full bg-success"
            aria-hidden
          />
          현재 위치
        </Text>
        <Text variant="caption" as="span" className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full bg-primary"
            aria-hidden
          />
          {name}
        </Text>
      </div>

      {locationLoading && (
        <Text variant="muted">현재 위치 확인 중…</Text>
      )}
    </div>
  );
}
