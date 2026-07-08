"use client";

import { useRef, useState } from "react";
import { useTripDetail } from "@/contexts/TripDetailContext";
import { mergeKmlPlacemarksIntoPlaces } from "@/lib/kml-import";
import { parseKmlPlacemarks } from "@/lib/kml-parser";

/**
 * Google My Maps KML 파일 가져오기 버튼
 * 브라우저에서 파일을 읽어 장소 목록에 추가합니다.
 */
export default function KmlImportButton() {
  const { data, updateData } = useTripDetail();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".kml")) {
      setMessage("KML 파일(.kml)만 선택할 수 있습니다.");
      return;
    }

    try {
      const kmlText = await file.text();
      const { placemarks, errors } = parseKmlPlacemarks(kmlText);

      if (errors.length > 0 && placemarks.length === 0) {
        setMessage(errors[0]);
        return;
      }

      const result = mergeKmlPlacemarksIntoPlaces(data.places, placemarks);

      updateData((prev) => ({
        ...prev,
        places: result.places,
      }));

      if (result.addedCount === 0 && result.skippedCount === 0) {
        setMessage("가져올 장소가 없습니다.");
      } else if (result.addedCount === 0) {
        setMessage(`중복된 장소 ${result.skippedCount}개는 건너뛰었습니다.`);
      } else if (result.skippedCount === 0) {
        setMessage(`${result.addedCount}개 장소를 추가했습니다.`);
      } else {
        setMessage(
          `${result.addedCount}개 추가, ${result.skippedCount}개 중복 건너뜀`,
        );
      }
    } catch {
      setMessage("KML 파일을 읽는 중 오류가 발생했습니다.");
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".kml"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden
      />

      <button
        type="button"
        onClick={handleClick}
        className="w-full rounded-xl border border-[#ebebeb] py-3 text-sm font-medium text-[#111111] transition-colors hover:border-[#0A84FF]/30 dark:border-white/20 dark:text-white"
      >
        📥 KML 가져오기
      </button>

      {message && (
        <p className="mt-2 text-sm text-[#6e6e73]" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
