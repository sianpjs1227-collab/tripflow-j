"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import type { MyMapsConnection } from "@/types/mymaps";
import { useTripDetail } from "@/contexts/TripDetailContext";
import {
  formatSyncResultMessage,
  runMyMapsSyncPipeline,
} from "@/lib/mymaps-sync";
import { logMyMapsSync } from "@/lib/mymaps-sync-log";
import {
  extractMapIdFromUrl,
  formatLastSyncTime,
  deleteMyMapsLink,
  loadMyMapsConnection,
  openMapsUrl,
  saveMyMapsLink,
  saveMyMapsConnection,
  buildMyMapsKmlUrl,
} from "@/lib/trip-maps";
import { Button, Card, Input, OverlayLayer, Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import KmlImportButton from "@/components/trip/places/KmlImportButton";

interface TripMyMapsManageSheetProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange?: () => void;
}

/** Google My Maps 연결·동기화·KML 파일 가져오기 */
export default function TripMyMapsManageSheet({
  tripId,
  isOpen,
  onClose,
  onConnectionChange,
}: TripMyMapsManageSheetProps) {
  const { data, updateData } = useTripDetail();
  const [inputLink, setInputLink] = useState("");
  const [connection, setConnection] = useState<MyMapsConnection | null>(null);
  const [linkError, setLinkError] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const stored = loadMyMapsConnection(tripId);
    setConnection(stored);
    setInputLink(stored?.viewerUrl ?? "");
    setLinkError("");
    setSyncError("");
  }, [tripId, isOpen]);

  const isConnected = Boolean(connection?.mapId);

  const handleSaveLink = () => {
    setLinkError("");

    const mapId = extractMapIdFromUrl(inputLink);
    if (!mapId) {
      setLinkError("공유 링크에서 map id(mid)를 찾을 수 없습니다.");
      return;
    }

    logMyMapsSync("연결 저장 — mid 추출", {
      shareLink: inputLink,
      mapId,
      kmlUrl: buildMyMapsKmlUrl(mapId),
    });

    const saved = saveMyMapsLink(tripId, inputLink);
    if (!saved) {
      setLinkError("링크를 저장할 수 없습니다.");
      return;
    }

    setConnection(saved);
    onConnectionChange?.();
  };

  const handleDisconnect = () => {
    if (!confirm("Google My Maps 연결을 해제할까요?")) return;

    deleteMyMapsLink(tripId);
    setConnection(null);
    setInputLink("");
    onConnectionChange?.();
  };

  const handleSync = async () => {
    if (!connection?.mapId) return;

    setSyncing(true);
    setSyncError("");

    const shareLink = connection.viewerUrl || inputLink;

    try {
      const pipeline = await runMyMapsSyncPipeline({
        shareLink,
        mapId: connection.mapId,
        existingPlaces: data.places,
      });

      updateData((prev) => ({
        ...prev,
        places: pipeline.importResult.places,
      }));

      const updatedConnection: MyMapsConnection = {
        ...connection,
        lastSyncAt: new Date().toISOString(),
        lastSyncResult: pipeline.syncResult,
      };

      saveMyMapsConnection(tripId, updatedConnection);
      setConnection(updatedConnection);
      onConnectionChange?.();
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      setSyncError(`동기화 실패: ${reason}`);
    } finally {
      setSyncing(false);
    }
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
        공유 링크 연결 및 자동 동기화
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
            placeholder="https://www.google.com/maps/d/viewer?mid=..."
          />
          <Text variant="caption">
            링크에서 mid가 자동으로 추출되어 저장됩니다.
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
          onClick={() => connection?.viewerUrl && openMapsUrl(connection.viewerUrl)}
          className="w-full text-primary"
          title={!isConnected ? "Google My Maps를 먼저 연결하세요." : undefined}
        >
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          🗺 My Maps 열기
        </Button>

        <div className="space-y-2 border-t border-border pt-4">
          <Text variant="label">동기화</Text>
          <Text variant="caption">
            My Maps에서 최신 KMZ를 받아 장소를 자동 업데이트합니다.
          </Text>
          <Button
            type="button"
            onClick={handleSync}
            disabled={!isConnected || syncing}
            className="w-full"
          >
            <RefreshCw
              className={cn("h-4 w-4 shrink-0", syncing && "animate-spin")}
              aria-hidden
            />
            {syncing ? "동기화 중…" : "동기화"}
          </Button>

          {connection?.lastSyncAt && (
            <Text variant="caption" className="block">
              마지막 동기화: {formatLastSyncTime(connection.lastSyncAt)}
            </Text>
          )}

          {connection?.lastSyncResult && (
            <Card padding="sm" className="bg-primary/5">
              <Text variant="body-medium" className="font-medium text-primary">
                {formatSyncResultMessage(connection.lastSyncResult)}
              </Text>
            </Card>
          )}

          {syncError && (
            <Card padding="sm" className="border-danger/30 bg-danger/5" role="alert">
              <Text variant="body-medium" className="font-semibold text-danger">
                {syncError}
              </Text>
              <Text variant="caption" className="mt-1 text-danger/80">
                자세한 내용은 브라우저 개발자 도구 콘솔을 확인하세요.
              </Text>
            </Card>
          )}
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <Text variant="label">KML / KMZ 파일</Text>
          <Text variant="caption">
            파일로 직접 가져오기 — My Maps 연결과 함께 사용할 수 있습니다.
          </Text>
          <KmlImportButton />
        </div>
      </div>
    </OverlayLayer>
  );
}
