"use client";

import { useEffect, useMemo, useState } from "react";
import type { Place, PlaceCategory, PlaceInput } from "@/types/place";
import {
  placeCategories,
  placeCategoryIcons,
  placeCategoryLabels,
} from "@/lib/place-utils";
import {
  Button,
  Card,
  Input,
  OverlayLayer,
  Text,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/cn";

type PlacePickerTab = "existing" | "new";

interface PlacePickerModalProps {
  isOpen: boolean;
  places: Place[];
  selectedPlaceId?: string;
  onClose: () => void;
  onSelect: (place: Place) => void;
  onCreatePlace: (input: PlaceInput) => Place;
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

const TABS: { id: PlacePickerTab; label: string }[] = [
  { id: "existing", label: "기존 장소" },
  { id: "new", label: "새 장소" },
];

/** 장소 탭 저장소에서 장소 선택 또는 새 장소 생성 */
export default function PlacePickerModal({
  isOpen,
  places,
  selectedPlaceId,
  onClose,
  onSelect,
  onCreatePlace,
}: PlacePickerModalProps) {
  const [activeTab, setActiveTab] = useState<PlacePickerTab>("existing");
  const [query, setQuery] = useState("");
  const [newForm, setNewForm] = useState<PlaceInput>(EMPTY_FORM);
  const [error, setError] = useState("");

  const filteredPlaces = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return places;

    return places.filter((place) =>
      place.name.toLowerCase().includes(trimmed),
    );
  }, [places, query]);

  useEffect(() => {
    if (!isOpen) return;

    setActiveTab(places.length === 0 ? "new" : "existing");
    setQuery("");
    setNewForm(EMPTY_FORM);
    setError("");
  }, [isOpen, places.length]);

  const handleClose = () => {
    setQuery("");
    setNewForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  const handleSelect = (place: Place) => {
    setQuery("");
    onSelect(place);
  };

  const handleNewFormChange = (
    field: keyof PlaceInput,
    value: string | PlaceCategory,
  ) => {
    setNewForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newForm.name.trim()) {
      setError("장소명을 입력해주세요.");
      return;
    }

    const place = onCreatePlace(newForm);
    setNewForm(EMPTY_FORM);
    setError("");
    onSelect(place);
  };

  return (
    <OverlayLayer
      isOpen={isOpen}
      sheet
      scrollBody={false}
      onClose={handleClose}
      closeLabel="장소 선택 닫기"
    >
      <div className="shrink-0 border-b border-border px-4 pb-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <Text variant="title-sm" as="h2" className="font-bold">
            장소 선택
          </Text>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            닫기
          </Button>
        </div>

        <div
          className="mt-4 flex gap-1 rounded-2xl border border-border bg-background p-1"
          role="tablist"
          aria-label="장소 선택 방식"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveTab(tab.id);
                  setError("");
                }}
                className={cn(
                  "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ease-out",
                  isActive
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "existing" && (
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="장소명 검색"
            className="mt-4"
          />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:px-5 sm:pb-5">
        {activeTab === "existing" ? (
          places.length === 0 ? (
            <div className="px-2 py-6 text-center">
              <Text variant="muted">저장된 장소가 없습니다.</Text>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("new")}
                className="mt-3 h-auto px-0 text-primary"
              >
                새 장소 탭에서 추가하기
              </Button>
            </div>
          ) : filteredPlaces.length === 0 ? (
            <Text variant="muted" className="px-2 py-6 text-center">
              검색 결과가 없습니다.
            </Text>
          ) : (
            <ul className="space-y-2" role="list">
              {filteredPlaces.map((place) => {
                const isSelected = place.id === selectedPlaceId;

                return (
                  <li key={place.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(place)}
                      className="w-full text-left"
                    >
                      <Card
                        padding="sm"
                        className={cn(
                          "transition-colors",
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "hover:border-primary/30",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl leading-none" aria-hidden>
                            {placeCategoryIcons[place.category]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <Text
                              variant="body-medium"
                              className="text-base font-semibold"
                            >
                              {place.name}
                            </Text>
                            <Text variant="muted" className="mt-0.5">
                              {placeCategoryLabels[place.category]}
                            </Text>
                          </div>
                        </div>
                      </Card>
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <Text variant="muted" className="text-sm">
              새 장소는 장소 탭에도 저장되며, 이 일정에 자동으로 연결됩니다.
            </Text>

            <label className="block">
              <Text variant="label" as="span">
                장소명
              </Text>
              <Input
                type="text"
                value={newForm.name}
                onChange={(e) => handleNewFormChange("name", e.target.value)}
                placeholder="예: 우나기노 에이토"
                className="mt-1"
              />
            </label>

            <label className="block">
              <Text variant="label" as="span">
                카테고리
              </Text>
              <select
                value={newForm.category}
                onChange={(e) =>
                  handleNewFormChange(
                    "category",
                    e.target.value as PlaceCategory,
                  )
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

            <label className="block">
              <Text variant="label" as="span">
                Google Maps 링크{" "}
                <Text variant="muted" as="span">(선택)</Text>
              </Text>
              <Input
                type="url"
                value={newForm.mapsLink}
                onChange={(e) => handleNewFormChange("mapsLink", e.target.value)}
                placeholder="https://maps.google.com/..."
                className="mt-1"
              />
              <Text variant="caption" className="mt-1">
                링크에 좌표가 포함되면 자동으로 저장됩니다.
              </Text>
            </label>

            <label className="block">
              <Text variant="label" as="span">
                주소 <Text variant="muted" as="span">(선택)</Text>
              </Text>
              <Input
                type="text"
                value={newForm.address}
                onChange={(e) => handleNewFormChange("address", e.target.value)}
                placeholder="예: 도쿄도 신주쿠구 ..."
                className="mt-1"
              />
            </label>

            <label className="block">
              <Text variant="label" as="span">
                메모 <Text variant="muted" as="span">(선택)</Text>
              </Text>
              <Textarea
                value={newForm.memo}
                onChange={(e) => handleNewFormChange("memo", e.target.value)}
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

            <Button type="submit" className="w-full">
              저장하고 선택
            </Button>
          </form>
        )}
      </div>
    </OverlayLayer>
  );
}
