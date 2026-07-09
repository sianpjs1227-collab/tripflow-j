"use client";

import { useEffect, useState } from "react";
import type { AddPlaceToScheduleInput } from "@/types/place";
import type { Place } from "@/types/place";
import { Button, Input, OverlayLayer, Text } from "@/components/ui";

interface AddPlaceToScheduleModalProps {
  isOpen: boolean;
  place: Place | null;
  onClose: () => void;
  onSave: (input: AddPlaceToScheduleInput) => void;
}

const EMPTY_FORM: AddPlaceToScheduleInput = {
  date: "",
  time: "",
};

/** 장소 → 일정 추가 (날짜·시간만 입력) */
export default function AddPlaceToScheduleModal({
  isOpen,
  place,
  onClose,
  onSave,
}: AddPlaceToScheduleModalProps) {
  const [form, setForm] = useState<AddPlaceToScheduleInput>(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setError("");
    }
  }, [isOpen, place?.id]);

  if (!isOpen || !place) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.date || !form.time) {
      setError("날짜와 시간을 입력해주세요.");
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
          일정에 추가
        </Text>
        <Text variant="muted" className="mt-1">
          {place.name}
        </Text>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <Text variant="label" as="span">
              날짜
            </Text>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, date: e.target.value }));
                setError("");
              }}
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
              onChange={(e) => {
                setForm((prev) => ({ ...prev, time: e.target.value }));
                setError("");
              }}
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
