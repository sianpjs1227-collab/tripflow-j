"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { AddPlaceToScheduleInput } from "@/types/place";
import type { Place } from "@/types/place";
import { timeToMinutes } from "@/lib/day-schedule-utils";
import { Button, Input, OverlayLayer, Text, TimePicker } from "@/components/ui";

interface AddPlaceToScheduleModalProps {
  isOpen: boolean;
  place: Place | null;
  onClose: () => void;
  onSave: (input: AddPlaceToScheduleInput) => void;
}

const EMPTY_FORM: AddPlaceToScheduleInput = {
  date: "",
  time: "",
  endTime: "",
};

/** 장소 → 일정 추가 (날짜·시간만 입력) */
export default function AddPlaceToScheduleModal({
  isOpen,
  place,
  onClose,
  onSave,
}: AddPlaceToScheduleModalProps) {
  const [form, setForm] = useState<AddPlaceToScheduleInput>(EMPTY_FORM);
  const [showEndTime, setShowEndTime] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setShowEndTime(false);
      setError("");
    }
  }, [isOpen, place?.id]);

  if (!isOpen || !place) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.date || !form.time) {
      setError("날짜와 시작시간을 입력해주세요.");
      return;
    }

    const endTime = showEndTime ? form.endTime?.trim() ?? "" : "";
    if (endTime && timeToMinutes(endTime) < timeToMinutes(form.time)) {
      setError("종료시간은 시작시간 이후여야 합니다.");
      return;
    }

    onSave({
      ...form,
      endTime: endTime || undefined,
    });
    setForm(EMPTY_FORM);
    setShowEndTime(false);
    setError("");
    onClose();
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setShowEndTime(false);
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

          <TimePicker
            label="🕒 시작시간"
            value={form.time}
            onChange={(time) => {
              setForm((prev) => ({ ...prev, time }));
              setError("");
            }}
            placeholder="시작시간 선택"
          />

          {showEndTime ? (
            <TimePicker
              label="🕒 종료시간"
              value={form.endTime ?? ""}
              onChange={(endTime) => {
                setForm((prev) => ({ ...prev, endTime }));
                setError("");
              }}
              placeholder="종료시간 선택"
              onClear={() => {
                setShowEndTime(false);
                setForm((prev) => ({ ...prev, endTime: "" }));
              }}
              clearLabel="제거"
            />
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowEndTime(true)}
              className="h-11 w-full justify-start gap-2 px-1 text-primary"
            >
              <Plus className="h-4 w-4" aria-hidden />
              종료시간 추가
            </Button>
          )}

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
