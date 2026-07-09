"use client";

import { useEffect, useMemo, useState } from "react";
import type { Place, PlaceInput } from "@/types/place";
import type { ScheduleInput, ScheduleItem } from "@/types/schedule";
import { getPlaceById, placeCategoryIcons } from "@/lib/place-utils";
import {
  Button,
  Card,
  Input,
  OverlayLayer,
  Text,
  Textarea,
} from "@/components/ui";
import PlacePickerModal from "./PlacePickerModal";

interface ScheduleModalProps {
  isOpen: boolean;
  editingItem: ScheduleItem | null;
  places: Place[];
  defaultDate?: string;
  /** 일정 추가 시 폼 초기값 (빈 시간 추천 등) */
  initialForm?: Partial<ScheduleInput>;
  onClose: () => void;
  onSave: (input: ScheduleInput) => void;
  onAddPlace: (input: PlaceInput) => Place;
  onDelete?: (id: string) => void;
}

const EMPTY_FORM: ScheduleInput = {
  date: "",
  time: "",
  title: "",
  placeId: "",
  memo: "",
};

/**
 * 일정 추가/수정 모달
 */
export default function ScheduleModal({
  isOpen,
  editingItem,
  places,
  defaultDate = "",
  initialForm,
  onClose,
  onSave,
  onAddPlace,
  onDelete,
}: ScheduleModalProps) {
  const [form, setForm] = useState<ScheduleInput>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isPlacePickerOpen, setIsPlacePickerOpen] = useState(false);
  const isEditing = editingItem !== null;

  const selectedPlace = useMemo(
    () => getPlaceById(places, form.placeId),
    [places, form.placeId],
  );

  useEffect(() => {
    if (!isOpen) return;

    if (editingItem) {
      setForm({
        date: editingItem.date,
        time: editingItem.time,
        title: editingItem.title,
        placeId: editingItem.placeId,
        memo: editingItem.memo ?? "",
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        date: initialForm?.date ?? defaultDate,
        time: initialForm?.time ?? "",
        title: initialForm?.title ?? "",
        placeId: initialForm?.placeId ?? "",
        memo: initialForm?.memo ?? "",
      });
    }
    setError("");
    setIsPlacePickerOpen(false);
  }, [isOpen, editingItem, defaultDate, initialForm]);

  const handleChange = (field: keyof ScheduleInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handlePlaceSelect = (place: Place) => {
    setForm((prev) => ({ ...prev, placeId: place.id }));
    setError("");
    setIsPlacePickerOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.date || !form.time || !form.title.trim()) {
      setError("날짜, 시간, 일정 제목을 입력해주세요.");
      return;
    }

    if (!form.placeId) {
      setError("장소를 선택해주세요.");
      return;
    }

    onSave(form);
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  const handleDelete = () => {
    if (!editingItem || !onDelete) return;
    if (!confirm("이 일정을 삭제할까요?")) return;
    onDelete(editingItem.id);
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setError("");
    setIsPlacePickerOpen(false);
    onClose();
  };

  return (
    <>
      <OverlayLayer
        isOpen={isOpen}
        sheet
        onClose={handleClose}
        closeLabel="모달 닫기"
      >
          <Text variant="title-sm" as="h2" className="text-xl font-bold">
            {isEditing ? "일정 수정" : "일정 추가"}
          </Text>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <label className="block">
              <Text variant="label" as="span">
                날짜
              </Text>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => handleChange("date", e.target.value)}
                className="mt-1"
              />
            </label>

            <label className="block">
              <Text variant="label" as="span">
                시간
              </Text>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => handleChange("time", e.target.value)}
                className="mt-1"
              />
            </label>

            <label className="block">
              <Text variant="label" as="span">
                일정 제목
              </Text>
              <Input
                type="text"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="예: 점심"
                className="mt-1"
              />
            </label>

            <div className="block">
              <Text variant="label" as="span">
                장소
              </Text>

              {selectedPlace ? (
                <Card padding="sm" className="mt-2 bg-primary/5">
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden>
                      {placeCategoryIcons[selectedPlace.category]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Text variant="body-medium" className="text-base font-semibold">
                        {selectedPlace.name}
                      </Text>
                      {(selectedPlace.mapsLink ||
                        selectedPlace.latitude != null) && (
                        <Text variant="caption" className="mt-1">
                          지도·좌표 연결됨
                        </Text>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPlacePickerOpen(true)}
                    className="mt-3 h-auto px-0"
                  >
                    장소 변경
                  </Button>
                </Card>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsPlacePickerOpen(true)}
                  className="mt-2 w-full border-dashed border-primary/40 text-primary"
                >
                  장소 선택
                </Button>
              )}
            </div>

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
              {isEditing && onDelete && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDelete}
                  className="border-danger/30 text-danger"
                >
                  삭제
                </Button>
              )}
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

      <PlacePickerModal
        isOpen={isPlacePickerOpen}
        places={places}
        selectedPlaceId={form.placeId}
        onClose={() => setIsPlacePickerOpen(false)}
        onSelect={handlePlaceSelect}
        onCreatePlace={onAddPlace}
      />
    </>
  );
}
