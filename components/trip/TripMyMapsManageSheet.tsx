"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { MyMapsConnection } from "@/types/mymaps";
import { useTrips } from "@/contexts/TripContext";
import {
  extractMapIdFromUrl,
  getMyMapsConnectionFromTrip,
  normalizeMapsUrl,
  openMapsUrl,
} from "@/lib/trip-maps";
import { Button, Card, Input, OverlayLayer, Text } from "@/components/ui";
import KmlImportButton from "@/components/trip/places/KmlImportButton";

interface TripMyMapsManageSheetProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange?: () => void;
}

/** Google My Maps 링크 연결 · KML 가져오기 */
export default function TripMyMapsManageSheet({
  tripId,
  isOpen,
  onClose,
  onConnectionChange,
}: TripMyMapsManageSheetProps) {
  const { getTripById, patchTripMyMaps, trips } = useTrips();
  const [inputLink, setInputLink] = useState("");
  const [connection, setConnection] = useState<MyMapsConnection | null>(null);
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const trip = getTripById(tripId);
    const stored = trip ? getMyMapsConnectionFromTrip(trip) : null;
    setConnection(stored);
    setInputLink(stored?.viewerUrl ?? "");
    setLinkError("");
  }, [tripId, isOpen, getTripById, trips]);

  const isConnected = Boolean(connection?.mapId);

  const handleSaveLink = () => {
    setLinkError("");

    const mapId = extractMapIdFromUrl(inputLink);
    if (!mapId) {
      setLinkError("공유 링크에서 map id(mid)를 찾을 수 없습니다.");
      return;
    }

    const saved: MyMapsConnection = {
      mapId,
      viewerUrl: normalizeMapsUrl(inputLink),
    };

    patchTripMyMaps(tripId, saved);
    setConnection(saved);
    onConnectionChange?.();
  };

  const handleDisconnect = () => {
    if (!confirm("Google My Maps 연결을 해제할까요?")) return;

    patchTripMyMaps(tripId, null);
    setConnection(null);
    setInputLink("");
    onConnectionChange?.();
  };

  return (
    <OverlayLayer
      isOpen={isOpen}
      sheet
      onClose={onClose}
      closeLabel="Google My Maps 닫기"
    >
      <Text variant="title-sm" as="h2" className="text-xl font-bold">
        Google My Maps
      </Text>
      <Text variant="muted" className="mt-1">
        KML 파일을 Google My Maps로 가져오면 여행 장소를 확인할 수 있습니다.
      </Text>

      <Card padding="sm" className="mt-4 bg-background">
        <div className="flex items-center gap-2">
          <span className="text-base" aria-hidden>
            {isConnected ? "🟢" : "⚪"}
          </span>
          <Text variant="body-medium" className="font-semibold">
            {isConnected ? "연결됨" : "연결 안됨"}
          </Text>
        </div>
        {isConnected && connection?.mapId && (
          <Text variant="caption" className="mt-1.5 break-all">
            map id: {connection.mapId}
          </Text>
        )}
      </Card>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Text variant="label" as="label">
            Google My Maps 공유 링크
          </Text>
          <Input
            type="url"
            value={inputLink}
            onChange={(event) => {
              setInputLink(event.target.value);
              setLinkError("");
            }}
            placeholder={`https://www.google.com/maps/d/viewer?mid=${"..."}`}
          />
          <Text variant="caption">
            저장된 링크로 My Maps를 바로 열 수 있습니다.
          </Text>
          {linkError && (
            <Text variant="body" className="text-danger" role="alert">
              {linkError}
            </Text>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleSaveLink}
              disabled={!inputLink.trim()}
              size="sm"
              className="flex-1"
            >
              연결 저장
            </Button>
            {isConnected && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDisconnect}
              >
                연결 해제
              </Button>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          disabled={!isConnected}
          onClick={() =>
            connection?.viewerUrl && openMapsUrl(connection.viewerUrl)
          }
          className="w-full text-primary"
          title={!isConnected ? "Google My Maps를 먼저 연결하세요." : undefined}
        >
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          🗺 My Maps 열기
        </Button>

        <div className="space-y-2 border-t border-border pt-4">
          <Text variant="label">KML 가져오기</Text>
          <Text variant="caption">
            KML 파일을 불러와 장소를 가져옵니다.
          </Text>
          <KmlImportButton />
        </div>
      </div>
    </OverlayLayer>
  );
}
