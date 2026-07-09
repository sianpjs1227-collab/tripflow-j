"use client";

import { useEffect, useState } from "react";
import type { Place, PlaceCategory, PlaceInput } from "@/types/place";
import {
  isKmlPlace,
  placeCategories,
  placeCategoryLabels,
} from "@/lib/place-utils";
import { Button, Input, OverlayLayer, Text, Textarea } from "@/components/ui";

interface PlaceModalProps {
  isOpen: boolean;
  editingPlace: Place | null;
  onClose: () => void;
  onSave: (input: PlaceInput) => void;
}

const EMPTY_FORM: PlaceInput = {
  name: "",
  category: "restaurant_bar",
  mapsLink: "",
  address: "",
  memo: "",
};

const selectClassName =
  "mt-1 h-10 w-full rounded-xl border border-border bg-card px-3.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

/** 장소 추가/수정 모달 */
export default function PlaceModal({
  isOpen,
  editingPlace,
  onClose,
  onSave,
}: PlaceModalProps) {
  const [form, setForm] = useState<PlaceInput>(EMPTY_FORM);
  const [error, setError] = useState("");
  const isEditing = editingPlace !== null;
  const isKml = editingPlace ? isKmlPlace(editingPlace) : false;

  useEffect(() => {
    if (!isOpen) return;

    if (editingPlace) {
      setForm({
        name: editingPlace.name,
        category: editingPlace.category,
        mapsLink: editingPlace.mapsLink ?? "",
        address: editingPlace.address ?? "",
        memo: editingPlace.memo ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError("");
  }, [isOpen, editingPlace]);

  if (!isOpen) return null;

  const handleChange = (
    field: keyof PlaceInput,
    value: string | PlaceCategory,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("장소명을 입력해주세요.");
      return;
    }

    onSave(form);
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  return (
    <OverlayLayer
      onClose={handleClose}
      closeLabel="모달 닫기"
      panelClassName="bg-card p-6 shadow-xl"
    >
        <Text variant="title-sm" as="h2" className="text-xl font-bold">
          {isEditing ? "장소 수정" : "장소 추가"}
        </Text>
        {!isEditing && (
          <Text variant="muted" className="mt-1">
            직접 추가한 장소는 Google Maps 링크·주소로 지도와 길찾기를 사용할 수
            있습니다.
          </Text>
        )}
        {isKml && (
          <Text variant="muted" className="mt-1">
            KML에서 가져온 장소입니다. 위치 정보는 변경되지 않습니다.
          </Text>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <Text variant="label" as="span">
              장소명
            </Text>
            <Input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="예: 우나기노 에이토"
              className="mt-1"
            />
          </label>

          <label className="block">
            <Text variant="label" as="span">
              카테고리
            </Text>
            <select
              value={form.category}
              onChange={(e) =>
                handleChange("category", e.target.value as PlaceCategory)
              }
              className={selectClassName}
            >
              {placeCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {placeCategoryLabels[cat]}
                </option>
              ))}
            </select>
          </label>

          {!isKml && (
            <>
              <label className="block">
                <Text variant="label" as="span">
                  Google Maps 링크{" "}
                  <Text variant="muted" as="span">(선택)</Text>
                </Text>
                <Input
                  type="url"
                  value={form.mapsLink}
                  onChange={(e) => handleChange("mapsLink", e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="mt-1"
                />
                <Text variant="caption" className="mt-1">
                  링크에 좌표가 포함되면 자동으로 저장되어 내 주변 검색에
                  사용됩니다.
                </Text>
              </label>

              <label className="block">
                <Text variant="label" as="span">
                  주소 <Text variant="muted" as="span">(선택)</Text>
                </Text>
                <Input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="예: 도쿄도 신주쿠구 ..."
                  className="mt-1"
                />
                <Text variant="caption" className="mt-1">
                  좌표가 없을 때 지도·길찾기 검색에 사용됩니다.
                </Text>
              </label>
            </>
          )}

          <label className="block">
            <Text variant="label" as="span">
              메모 <Text variant="muted" as="span">(선택)</Text>
            </Text>
            <Textarea
              value={form.memo}
              onChange={(e) => handleChange("memo", e.target.value)}
              placeholder="추가 메모"
              rows={3}
              className="mt-1"
            />
          </label>

          {error && (
            <Text variant="body" className="text-danger" role="alert">
              {error}
            </Text>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
            >
              취소
            </Button>
            <Button type="submit" className="flex-1">
              저장
            </Button>
          </div>
        </form>
    </OverlayLayer>
  );
}
