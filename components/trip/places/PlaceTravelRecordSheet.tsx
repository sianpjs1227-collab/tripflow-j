"use client";

import { useEffect, useState } from "react";
import { Camera, Star } from "lucide-react";
import type { Place, PlaceRating, PlaceTravelRecordInput } from "@/types/place";
import {
  buildTravelRecordForm,
  isPlaceVisited,
} from "@/lib/place-visit";
import { Button, Card, Input, OverlayLayer, Text } from "@/components/ui";
import { cn } from "@/lib/cn";

interface PlaceTravelRecordSheetProps {
  isOpen: boolean;
  place: Place | null;
  onClose: () => void;
  onSave: (placeId: string, input: PlaceTravelRecordInput) => void;
}

const RATINGS: PlaceRating[] = [1, 2, 3, 4, 5];

/** 여행 기록 입력 Bottom Sheet */
export default function PlaceTravelRecordSheet({
  isOpen,
  place,
  onClose,
  onSave,
}: PlaceTravelRecordSheetProps) {
  const [form, setForm] = useState<PlaceTravelRecordInput | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !place) return;
    setForm(buildTravelRecordForm(place));
    setError("");
  }, [isOpen, place]);

  if (!place || !form) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (form.visited && !form.visitedAt) {
      setError("방문 날짜를 입력해주세요.");
      return;
    }

    if (!form.visited && place && isPlaceVisited(place)) {
      if (!confirm("방문 기록을 취소하시겠습니까?")) return;
    }

    onSave(place.id, form);
    onClose();
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return (
    <OverlayLayer
      isOpen={isOpen}
      sheet
      onClose={handleClose}
      closeLabel="여행 기록 닫기"
    >
      <Text variant="title-sm" as="h2" className="text-xl font-bold">
        📝 여행 기록
      </Text>
      <Text variant="muted" className="mt-1">
        {place.name}
      </Text>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
          <Text variant="label" as="span">
            방문 여부
          </Text>
          <button
            type="button"
            role="switch"
            aria-checked={form.visited}
            onClick={() =>
              setForm((prev) =>
                prev ? { ...prev, visited: !prev.visited } : prev,
              )
            }
            className={cn(
              "relative h-7 w-12 rounded-full transition-colors",
              form.visited ? "bg-primary" : "bg-border",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-card shadow-sm transition-transform",
                form.visited && "translate-x-5",
              )}
            />
          </button>
        </label>

        {form.visited && (
          <>
            <label className="block">
              <Text variant="label" as="span">
                방문 날짜
              </Text>
              <Input
                type="datetime-local"
                value={form.visitedAt}
                onChange={(event) =>
                  setForm((prev) =>
                    prev
                      ? { ...prev, visitedAt: event.target.value }
                      : prev,
                  )
                }
                className="mt-1"
              />
            </label>

            <div className="block">
              <Text variant="label" as="span">
                개인 평점
              </Text>
              <div className="mt-2 flex gap-2">
                {RATINGS.map((rating) => {
                  const active = form.rating != null && rating <= form.rating;

                  return (
                    <button
                      key={rating}
                      type="button"
                      onClick={() =>
                        setForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                rating: prev.rating === rating ? null : rating,
                              }
                            : prev,
                        )
                      }
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                        active
                          ? "border-warning/40 bg-warning/10 text-warning"
                          : "border-border bg-background text-muted hover:border-warning/30",
                      )}
                      aria-label={`${rating}점`}
                    >
                      <Star
                        className={cn(
                          "h-5 w-5",
                          active && "fill-current",
                        )}
                        aria-hidden
                      />
                    </button>
                  );
                })}
              </div>
              {form.rating && (
                <Text variant="caption" className="mt-1.5">
                  {form.rating}점
                </Text>
              )}
            </div>

            <label className="block">
              <Text variant="label" as="span">
                한줄 메모
              </Text>
              <Input
                type="text"
                value={form.recordMemo}
                onChange={(event) =>
                  setForm((prev) =>
                    prev
                      ? { ...prev, recordMemo: event.target.value }
                      : prev,
                  )
                }
                placeholder="예: 분위기 좋고 커피 맛있음"
                className="mt-1"
              />
            </label>

            <Card padding="sm" className="bg-background opacity-70">
              <div className="flex items-center gap-2 text-muted">
                <Camera className="h-4 w-4 shrink-0" aria-hidden />
                <div>
                  <Text variant="body-medium" className="font-medium">
                    사진
                  </Text>
                  <Text variant="caption" className="mt-0.5">
                    준비 중 — 곧 추가될 예정입니다
                  </Text>
                </div>
              </div>
            </Card>
          </>
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
