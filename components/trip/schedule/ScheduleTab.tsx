"use client";

import { useEffect, useMemo, useState } from "react";
import { Map as MapIcon, Plus, Route } from "lucide-react";
import type { Trip } from "@/types/trip";
import type { Place, PlaceInput, PlaceTravelRecordInput } from "@/types/place";
import type { ScheduleInput, ScheduleItem } from "@/types/schedule";
import { useTripDetail } from "@/contexts/TripDetailContext";
import {
  buildEventFromInput,
  toScheduleItem,
} from "@/lib/event-utils";
import {
  buildTripDates,
  formatScheduleChipDate,
  groupEventsByDate,
  sortEvents,
} from "@/lib/schedule-utils";
import {
  analyzeDayGaps,
  buildDayRouteUrl,
  getDayRouteItems,
  suggestTimeInGap,
  type DayGap,
} from "@/lib/day-schedule-utils";
import type { GapRecommendedPlace } from "@/lib/day-gap-recommendations";
import { scheduleItemToPlace } from "@/lib/schedule-maps";
import { usePlaceActionSheet } from "@/hooks/usePlaceActionSheet";
import { usePlaceFavorites } from "@/hooks/usePlaceFavorites";
import PlaceActionSheet from "@/components/map/PlaceActionSheet";
import { getPlaceById, createPlace } from "@/lib/place-utils";
import { applyTravelRecord } from "@/lib/place-visit";
import { formatExpenseAmount } from "@/lib/expense-utils";
import { tripHasExchangeRate } from "@/lib/currency-utils";
import { STICKY_LAYER_VARS, useStickyLayer } from "@/hooks/useStickyLayer";
import { Button, Card, Chip, Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import ScheduleModal from "./ScheduleModal";
import DayGapSection from "./DayGapSection";
import DaySummaryCard from "./DaySummaryCard";
import ScheduleItemCard from "./ScheduleItemCard";
import ScheduleDaySubviewTabs, {
  type ScheduleDaySubview,
} from "./ScheduleDaySubviewTabs";

interface ScheduleTabProps {
  trip: Trip;
}

function ScheduleTabContent({ trip }: ScheduleTabProps) {
  const { tripId, data, updateData } = useTripDetail();
  const { favoriteIds, isFavorite, toggleFavorite } = usePlaceFavorites(tripId);
  const { previewState, openPlace, closePlace } = usePlaceActionSheet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [gapPrefill, setGapPrefill] = useState<Partial<ScheduleInput> | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [activeSubview, setActiveSubview] =
    useState<ScheduleDaySubview>("schedule");
  const dayChipsRef = useStickyLayer(STICKY_LAYER_VARS.dayChips);
  const subviewTabsRef = useStickyLayer(STICKY_LAYER_VARS.scheduleSubview);

  const grouped = useMemo(() => {
    const groups = groupEventsByDate(data.events);
    return groups.map((group) => ({
      date: group.date,
      items: group.items.map((event) =>
        toScheduleItem(event, getPlaceById(data.places, event.placeId)),
      ),
    }));
  }, [data.events, data.places]);

  const tripDates = useMemo(
    () => buildTripDates(trip.startDate, trip.endDate),
    [trip.startDate, trip.endDate],
  );

  const groupedByDate = useMemo(() => {
    return new Map(grouped.map((group) => [group.date, group.items]));
  }, [grouped]);

  const dayTabs = useMemo(
    () =>
      tripDates.map((date, index) => ({
        date,
        dayNumber: index + 1,
        chipDate: formatScheduleChipDate(date),
        items: groupedByDate.get(date) ?? [],
      })),
    [tripDates, groupedByDate],
  );

  useEffect(() => {
    if (dayTabs.length === 0) {
      setSelectedDate("");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const defaultSelectedDate = dayTabs.some((day) => day.date === today)
      ? today
      : dayTabs[0].date;

    setSelectedDate((prev) =>
      dayTabs.some((day) => day.date === prev) ? prev : defaultSelectedDate,
    );
  }, [dayTabs]);

  const openCreateModal = () => {
    setEditingItem(null);
    setGapPrefill(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ScheduleItem) => {
    setEditingItem(item);
    setGapPrefill(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setGapPrefill(null);
  };

  const handleSave = (input: ScheduleInput) => {
    updateData((prev) => {
      const event = buildEventFromInput(input, editingItem?.id);

      const events = editingItem
        ? prev.events.map((e) => (e.id === editingItem.id ? event : e))
        : [...prev.events, event];

      // 시작시간 기준 자동 정렬 (날짜 → 시간)
      return { ...prev, events: sortEvents(events) };
    });
  };

  const handleDelete = (id: string) => {
    updateData((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== id),
    }));
  };

  const handleAddPlace = (input: PlaceInput): Place => {
    const place = createPlace(input);
    updateData((prev) => ({
      ...prev,
      places: [...prev.places, place],
    }));
    return place;
  };

  const handleSaveTravelRecord = (
    placeId: string,
    input: PlaceTravelRecordInput,
  ) => {
    updateData((prev) => ({
      ...prev,
      places: prev.places.map((place) =>
        place.id === placeId ? applyTravelRecord(place, input) : place,
      ),
    }));
  };

  const getPlaceFromData = (placeId: string) =>
    data.places.find((place) => place.id === placeId);

  const handleAddToScheduleFromSheet = (
    place: Place,
    prefill?: Partial<ScheduleInput>,
  ) => {
    closePlace();
    setEditingItem(null);
    setGapPrefill(
      prefill ?? {
        placeId: place.id,
        date: selectedDate,
      },
    );
    setIsModalOpen(true);
  };

  const handleOpenSchedulePlace = (item: ScheduleItem) => {
    const place =
      getPlaceById(data.places, item.placeId) ?? scheduleItemToPlace(item);
    openPlace(place);
  };

  const handleOpenPlaceFromGap = (place: GapRecommendedPlace, gap: DayGap) => {
    if (!selectedDay) return;

    openPlace(place, {
      schedulePrefill: {
        date: selectedDay.date,
        time: suggestTimeInGap(gap),
        placeId: place.id,
      },
      distanceMeters: place.distanceMeters,
      walkingMinutes: place.walkingMinutes,
    });
  };

  const handleOpenDayRoute = () => {
    if (!selectedDay) return;
    const url = buildDayRouteUrl(selectedDay.items);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const selectedDay =
    dayTabs.find((day) => day.date === selectedDate) ?? dayTabs[0];

  const dayRouteItems = selectedDay ? getDayRouteItems(selectedDay.items) : [];
  const canShowDayRoute = dayRouteItems.length > 0;
  const dayGaps = useMemo(
    () => (selectedDay ? analyzeDayGaps(selectedDay.items) : []),
    [selectedDay],
  );

  const daySummary = useMemo(() => {
    if (!selectedDay) return null;

    const items = selectedDay.items;
    const scheduleCount = items.length;
    const placeCount = new Set(
      items.map((item) => item.placeId).filter(Boolean),
    ).size;
    const dayExpenses = data.expenses.filter(
      (expense) => expense.date === selectedDay.date,
    );
    const expenseTotal = dayExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
    const currencyCode = tripHasExchangeRate(trip) ? trip.currency : "KRW";
    const expenseLabel = formatExpenseAmount(expenseTotal, currencyCode);
    const favoriteCount = items.filter(
      (item) => item.placeId && favoriteIds.has(item.placeId),
    ).length;

    return {
      scheduleCount,
      placeCount,
      expenseLabel,
      favoriteCount,
    };
  }, [selectedDay, data.expenses, trip, favoriteIds]);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <Text variant="title-sm" as="h2">
          일정
        </Text>
        <Button type="button" onClick={openCreateModal} size="sm" className="shrink-0">
          <Plus className="h-4 w-4" aria-hidden />
          추가
        </Button>
      </div>

      {dayTabs.length === 0 ? (
        <Text variant="muted" className="py-6 text-center">
          아직 등록된 일정이 없습니다.
        </Text>
      ) : (
        <>
          <div
            ref={dayChipsRef}
            className="sticky-layer-day-chips -mx-4 border-b border-border bg-background/95 px-4 py-1.5 backdrop-blur-md sm:-mx-5 sm:px-5"
          >
            <div className="scrollbar-hide overflow-x-auto">
              <div className="flex w-max gap-1.5">
                {dayTabs.map((day) => {
                  const isSelected = selectedDay?.date === day.date;

                  return (
                    <Chip
                      key={day.date}
                      active={isSelected}
                      onClick={() => setSelectedDate(day.date)}
                      className="min-w-[3.75rem] flex-col gap-0 px-2.5 py-1.5 transition-all duration-200"
                    >
                      <span className="text-[11px] font-semibold leading-none">
                        DAY{day.dayNumber}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] leading-none",
                          isSelected ? "text-white/85" : "text-muted",
                        )}
                      >
                        {day.chipDate}
                      </span>
                    </Chip>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            ref={subviewTabsRef}
            className="sticky-layer-schedule-subview -mx-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur-md sm:-mx-5 sm:px-5"
          >
            <ScheduleDaySubviewTabs
              activeView={activeSubview}
              onChange={setActiveSubview}
            />
          </div>

          {selectedDay && daySummary && (
            <div key={selectedDay.date} className="animate-slide-up space-y-3">
              <DaySummaryCard
                scheduleCount={daySummary.scheduleCount}
                placeCount={daySummary.placeCount}
                expenseLabel={daySummary.expenseLabel}
                favoriteCount={daySummary.favoriteCount}
              />

              <div
                key={`${selectedDay.date}-${activeSubview}`}
                className="scroll-margin-sticky animate-fade-in"
              >
                {activeSubview === "schedule" && (
                  <>
                    {selectedDay.items.length === 0 ? (
                      <Card padding="lg" className="text-center">
                        <Text variant="muted">아직 일정이 없습니다.</Text>
                        <Button
                          type="button"
                          onClick={openCreateModal}
                          size="sm"
                          className="mt-4"
                        >
                          <Plus className="h-4 w-4" aria-hidden />
                          일정 추가
                        </Button>
                      </Card>
                    ) : (
                      <ul className="space-y-0" role="list">
                        {selectedDay.items.map((item, index) => {
                          const place = getPlaceById(data.places, item.placeId);

                          return (
                            <ScheduleItemCard
                              key={item.id}
                              item={item}
                              category={place?.category ?? "other"}
                              isLast={index === selectedDay.items.length - 1}
                              onEdit={() => openEditModal(item)}
                              onOpenPlace={() => handleOpenSchedulePlace(item)}
                            />
                          );
                        })}
                      </ul>
                    )}
                  </>
                )}

                {activeSubview === "route" && (
                  <>
                    {!canShowDayRoute ? (
                      <Card padding="lg" className="text-center">
                        <Route
                          className="mx-auto h-8 w-8 text-muted"
                          aria-hidden
                        />
                        <Text variant="muted" className="mt-3">
                          장소가 등록된 일정이 없습니다.
                        </Text>
                        <Text variant="caption" className="mt-1">
                          일정에 장소를 연결하면 경로를 확인할 수 있습니다.
                        </Text>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        <Card padding="md">
                          <Text variant="body-medium" className="font-semibold">
                            Day 경로
                          </Text>
                          <Text variant="muted" className="mt-1">
                            {dayRouteItems.length}개 장소 · 시간순 경유
                          </Text>

                          <ol className="mt-4 space-y-3" role="list">
                            {dayRouteItems.map((item, index) => (
                              <li
                                key={item.id}
                                className="flex items-start gap-3"
                              >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                  {index + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <Text variant="muted" className="text-xs">
                                    {item.time}
                                  </Text>
                                  <Text variant="body-medium" className="font-medium">
                                    {item.placeName}
                                  </Text>
                                </div>
                              </li>
                            ))}
                          </ol>
                        </Card>

                        <Button
                          type="button"
                          onClick={handleOpenDayRoute}
                          className="w-full"
                        >
                          <MapIcon className="h-4 w-4" aria-hidden />
                          Google Maps에서 경로 보기
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {activeSubview === "recommend" && (
                  <>
                    {selectedDay.items.length < 2 ? (
                      <Card padding="lg" className="text-center">
                        <Text variant="muted">
                          일정이 2개 이상 등록되면 빈 시간 추천을 확인할 수
                          있습니다.
                        </Text>
                      </Card>
                    ) : dayGaps.length === 0 ? (
                      <Card padding="lg" className="text-center">
                        <Text variant="muted">
                          이 날짜에 추천할 빈 시간이 없습니다.
                        </Text>
                      </Card>
                    ) : (
                      <DayGapSection
                        dayItems={selectedDay.items}
                        places={data.places}
                        onOpenPlace={handleOpenPlaceFromGap}
                        className="mt-0"
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <ScheduleModal
        isOpen={isModalOpen}
        editingItem={editingItem}
        places={data.places}
        defaultDate={selectedDate}
        initialForm={gapPrefill ?? undefined}
        onClose={closeModal}
        onSave={handleSave}
        onAddPlace={handleAddPlace}
        onDelete={handleDelete}
      />

      <PlaceActionSheet
        previewState={previewState}
        onClose={closePlace}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        getPlace={getPlaceFromData}
        onSaveTravelRecord={handleSaveTravelRecord}
        onAddToSchedule={handleAddToScheduleFromSheet}
      />
    </div>
  );
}

/** 일정 탭 — TripDetailData.events / places 사용 */
export default function ScheduleTab({ trip }: ScheduleTabProps) {
  return <ScheduleTabContent trip={trip} />;
}
