"use client";

import { useRef, useState } from "react";
import { FileDown } from "lucide-react";
import type { KmlPlacemark } from "@/types/kml";
import { useTripDetail } from "@/contexts/TripDetailContext";
import {
  hasExistingKmlPlaces,
  mergeKmlPlacemarksIntoPlaces,
  updateKmlPlacemarksIntoPlaces,
} from "@/lib/kml-import";
import { extractKmlFromKmzBuffer } from "@/lib/kmz-utils";
import { parseKmlPlacemarks } from "@/lib/kml-parser";
import { Button, Card, OverlayLayer, Text } from "@/components/ui";

function formatImportMessage(
  addedCount: number,
  skippedCount: number,
  updatedCount?: number,
): string {
  if (updatedCount != null && updatedCount > 0) {
    const parts: string[] = [`${updatedCount}개 갱신`];
    if (addedCount > 0) parts.push(`${addedCount}개 추가`);
    return parts.join(", ");
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

/** Google My Maps KML 파일 가져오기 — 여행 설정 영역 전용 */
export default function KmlImportButton() {
  const { data, updateData } = useTripDetail();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingPlacemarks, setPendingPlacemarks] = useState<
    KmlPlacemark[] | null
  >(null);

  const handleClick = () => {
    setMessage(null);
    fileInputRef.current?.click();
  };

  const applyImport = (placemarks: KmlPlacemark[], mode: "merge" | "update") => {
    const result =
      mode === "update"
        ? updateKmlPlacemarksIntoPlaces(data.places, placemarks)
        : mergeKmlPlacemarksIntoPlaces(data.places, placemarks);

    updateData((prev) => ({
      ...prev,
      places: result.places,
    }));

    setMessage(
      formatImportMessage(
        result.addedCount,
        result.skippedCount,
        result.updatedCount,
      ),
    );
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".kml") &&
        !file.name.toLowerCase().endsWith(".kmz")) {
      setMessage("KML(.kml) 또는 KMZ(.kmz) 파일만 선택할 수 있습니다.");
      return;
    }

    try {
      const lowerName = file.name.toLowerCase();
      const kmlText = lowerName.endsWith(".kmz")
        ? extractKmlFromKmzBuffer(await file.arrayBuffer())
        : await file.text();
      const { placemarks, errors } = parseKmlPlacemarks(kmlText);

      if (errors.length > 0 && placemarks.length === 0) {
        setMessage(errors[0]);
        return;
      }

      if (hasExistingKmlPlaces(data.places) && placemarks.length > 0) {
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
    applyImport(pendingPlacemarks, "update");
    setPendingPlacemarks(null);
  };

  const handleCancelUpdate = () => {
    setPendingPlacemarks(null);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".kml,.kmz"
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
        KML / KMZ 가져오기
      </Button>

      {message && (
        <Text variant="muted" className="mt-2" role="status">
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
