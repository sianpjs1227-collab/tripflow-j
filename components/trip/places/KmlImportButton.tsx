"use client";

import { useRef, useState } from "react";
import { FileDown } from "lucide-react";
import { useTripDetail } from "@/contexts/TripDetailContext";
import {
  hasExistingKmlPlaces,
  mergeKmlPlacemarksIntoPlaces,
  updateKmlPlacemarksIntoPlaces,
} from "@/lib/kml-import";
import { extractKmlFromKmzBuffer } from "@/lib/kmz-utils";
import { parseKmlPlacemarks } from "@/lib/kml-parser";
import type { KmlImportResult, KmlPlacemark } from "@/types/kml";
import { Button, Card, OverlayLayer, Text } from "@/components/ui";

function formatImportMessage(
  addedCount: number,
  skippedCount: number,
  updatedCount?: number,
  deletedCount?: number,
): string {
  if (updatedCount != null) {
    const parts: string[] = [];
    if (addedCount > 0) parts.push(`추가 ${addedCount}개`);
    if (updatedCount > 0) parts.push(`업데이트 ${updatedCount}개`);
    if ((deletedCount ?? 0) > 0) parts.push(`삭제 ${deletedCount}개`);
    if (skippedCount > 0) parts.push(`건너뜀 ${skippedCount}개`);
    if (parts.length > 0) return parts.join("\n");
    return "가져올 장소가 없습니다.";
  }

  if (addedCount === 0 && skippedCount === 0) {
    return "가져올 장소가 없습니다.";
  }
  if (addedCount === 0) {
    return `중복된 장소 ${skippedCount}개는 건너뛰었습니다.`;
  }
  if (skippedCount === 0) {
    return `${addedCount}개 장소를 추가했습니다.`;
  }
  return `${addedCount}개 추가, ${skippedCount}개 중복 건너뜀`;
}

function isSupportedKmlFileName(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".kml") || lower.endsWith(".kmz");
}

/** KML 파일 가져오기 — 여행 My Maps 설정 영역 */
export default function KmlImportButton() {
  const { data, updateData } = useTripDetail();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingPlacemarks, setPendingPlacemarks] = useState<
    KmlPlacemark[] | null
  >(null);
  /** KML에 없는 KML 장소 삭제 — 기본 OFF */
  const [removeMissingKmlPlaces, setRemoveMissingKmlPlaces] = useState(false);

  const handleClick = () => {
    setMessage(null);
    fileInputRef.current?.click();
  };

  const applyImport = (
    placemarks: KmlPlacemark[],
    mode: "merge" | "update",
    options?: { removeMissingKmlPlaces?: boolean },
  ) => {
    // prev.places 기준으로 merge — 확인 Dialog 동안 stale data.places 사용 방지
    const holder: { result: KmlImportResult | null } = { result: null };

    updateData((prev) => {
      holder.result =
        mode === "update"
          ? updateKmlPlacemarksIntoPlaces(prev.places, placemarks, {
              removeMissingKmlPlaces: options?.removeMissingKmlPlaces === true,
            })
          : mergeKmlPlacemarksIntoPlaces(prev.places, placemarks);

      const nextPlaces = holder.result.places;
      const deletedIds = holder.result.deletedIds ?? [];

      console.log("[KmlImportButton] applyImport → updateData", {
        mode,
        removeMissingKmlPlaces: options?.removeMissingKmlPlaces === true,
        prevPlacesLength: prev.places.length,
        nextPlacesLength: nextPlaces.length,
        deletedCount: holder.result.deletedCount ?? 0,
        deletedIds,
        deletedNames: holder.result.deletedNames ?? [],
        deletedStillInNext: deletedIds.filter((id) =>
          nextPlaces.some((place) => place.id === id),
        ),
      });
      console.log("[places.delete.persist][1_kml.deletedIds]", {
        deletedIds,
        deletedNames: holder.result.deletedNames ?? [],
        nextPlacesLength: nextPlaces.length,
      });

      return {
        ...prev,
        places: nextPlaces,
      };
    });

    const importResult = holder.result;
    if (!importResult) return;

    setMessage(
      formatImportMessage(
        importResult.addedCount,
        importResult.skippedCount,
        importResult.updatedCount,
        importResult.deletedCount,
      ),
    );
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!isSupportedKmlFileName(file.name)) {
      setMessage("KML 파일만 선택할 수 있습니다.");
      return;
    }

    try {
      const lowerName = file.name.toLowerCase();
      // 내부적으로 .kmz 도 허용 (UI에는 KML만 표기)
      const kmlText = lowerName.endsWith(".kmz")
        ? extractKmlFromKmzBuffer(await file.arrayBuffer())
        : await file.text();
      const { placemarks, errors } = parseKmlPlacemarks(kmlText);

      if (errors.length > 0 && placemarks.length === 0) {
        setMessage(errors[0]);
        return;
      }

      if (hasExistingKmlPlaces(data.places) && placemarks.length > 0) {
        setRemoveMissingKmlPlaces(false);
        setPendingPlacemarks(placemarks);
        return;
      }

      applyImport(placemarks, "merge");
    } catch {
      setMessage("KML 파일을 읽는 중 오류가 발생했습니다.");
    }
  };

  const handleConfirmUpdate = () => {
    if (!pendingPlacemarks) return;
    applyImport(pendingPlacemarks, "update", {
      removeMissingKmlPlaces,
    });
    setPendingPlacemarks(null);
    setRemoveMissingKmlPlaces(false);
  };

  const handleCancelUpdate = () => {
    setPendingPlacemarks(null);
    setRemoveMissingKmlPlaces(false);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".kml,.kmz,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden
      />

      <Button
        type="button"
        variant="secondary"
        onClick={handleClick}
        className="w-full"
      >
        <FileDown className="h-4 w-4 shrink-0" aria-hidden />
        KML 가져오기
      </Button>

      {message && (
        <Text
          variant="muted"
          className="mt-2 whitespace-pre-line"
          role="status"
        >
          {message}
        </Text>
      )}

      {pendingPlacemarks && (
        <OverlayLayer onClose={handleCancelUpdate}>
          <Card
            padding="lg"
            className="w-full max-w-sm animate-slide-up bg-card shadow-xl"
            role="dialog"
            aria-labelledby="kml-update-title"
          >
            <Text variant="title-sm" as="h2" id="kml-update-title">
              KML 데이터를 업데이트하시겠습니까?
            </Text>
            <Text variant="muted" className="mt-2 leading-relaxed">
              KML에서 가져온 장소는 최신 정보로 갱신됩니다. 직접 추가한 장소와
              일정·즐겨찾기는 유지됩니다.
            </Text>

            <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5">
              <input
                type="checkbox"
                checked={removeMissingKmlPlaces}
                onChange={(e) => setRemoveMissingKmlPlaces(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
              />
              <span className="min-w-0">
                <Text
                  variant="body-medium"
                  as="span"
                  className="block text-[13px]"
                >
                  KML에 없는 KML 장소 삭제
                </Text>
                <Text variant="muted" as="span" className="mt-0.5 block text-[12px]">
                  My Maps에서 지운 장소만 앱에서도 제거합니다. 직접 추가한
                  장소는 삭제되지 않습니다.
                </Text>
              </span>
            </label>

            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancelUpdate}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={handleConfirmUpdate}
                className="flex-1"
              >
                업데이트
              </Button>
            </div>
          </Card>
        </OverlayLayer>
      )}
    </div>
  );
}
