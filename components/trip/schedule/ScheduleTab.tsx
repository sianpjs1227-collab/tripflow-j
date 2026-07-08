"use client";

import { useEffect, useMemo, useState } from "react";
import type { Trip } from "@/types/trip";
import type { ScheduleInput, ScheduleItem } from "@/types/schedule";
import {
  upsertPlaceInData,
  useTripDetail,
} from "@/contexts/TripDetailContext";
import {
  buildEventFromInput,
  toScheduleItem,
  toScheduleItems,
} from "@/lib/event-utils";
import {
  buildTripDates,
  formatScheduleDate,
  groupEventsByDate,
} from "@/lib/schedule-utils";
import { openDirectionsForScheduleItem } from "@/lib/schedule-maps";
import { getPlaceById } from "@/lib/place-utils";
import ScheduleModal from "./ScheduleModal";

interface ScheduleTabProps {
  trip: Trip;
}

function ScheduleTabContent({ trip }: ScheduleTabProps) {
  const { data, updateData } = useTripDetail();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [selectedDate, setSelectedDate] = useState("");

  const scheduleItems = useMemo(
    () => toScheduleItems(data.events, data.places),
    [data.events, data.places],
  );

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
        label: `Day${index + 1}`,
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
    setIsModalOpen(true);
  };

  const openEditModal = (item: ScheduleItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = (input: ScheduleInput) => {
    updateData((prev) => {
      const { data: withPlace, place } = upsertPlaceInData(
        prev,
        input.placeName,
        input.mapsLink,
      );

      const event = buildEventFromInput(
        input,
        place.id,
        editingItem?.id,
      );

      const events = editingItem
        ? withPlace.events.map((e) => (e.id === editingItem.id ? event : e))
        : [...withPlace.events, event];

      return { ...withPlace, events };
    });
  };

  const handleDelete = (id: string) => {
    updateData((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== id),
    }));
  };

  const selectedDay =
    dayTabs.find((day) => day.date === selectedDate) ?? dayTabs[0];

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold">일정</h2>
      <p className="mt-2 text-sm text-[#6e6e73]">
        {trip.startDate} ~ {trip.endDate} ({trip.duration})
      </p>

      <button
        type="button"
        onClick={openCreateModal}
        className="mt-4 w-full rounded-xl bg-[#0A84FF] py-3 text-sm font-semibold text-white"
      >
        일정 추가
      </button>

      {dayTabs.length === 0 ? (
        <p className="mt-6 text-sm text-[#6e6e73]">
          아직 등록된 일정이 없습니다.
        </p>
      ) : (
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {dayTabs.map((day) => {
              const isSelected = selectedDay?.date === day.date;

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-[#0A84FF] text-white"
                      : "border border-[#ebebeb] bg-white text-[#111111] dark:border-white/20 dark:bg-white/[0.05] dark:text-white"
                  }`}
                >
                  {day.label} ({day.items.length})
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-[#6e6e73]">
                {selectedDay.label} · {formatScheduleDate(selectedDay.date)}
              </h3>

              {selectedDay.items.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-[#ebebeb] bg-white p-5 text-center dark:border-white/10 dark:bg-white/[0.05]">
                  <p className="text-sm text-[#6e6e73]">
                    등록된 일정이 없습니다.
                  </p>
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="mt-4 rounded-xl bg-[#0A84FF] px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    + 일정 추가
                  </button>
                </div>
              ) : (
                <ul className="mt-3 space-y-2" role="list">
                  {selectedDay.items.map((item) => (
                    <li key={item.id}>
                      <div className="rounded-xl border border-[#ebebeb] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.05]">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="w-full text-left"
                        >
                          <p className="text-sm font-semibold text-[#111111] dark:text-white">
                            {item.time}
                          </p>
                          <p className="mt-1 text-base text-[#111111] dark:text-white">
                            {item.title}
                          </p>
                          {item.memo && (
                            <p className="mt-1 text-sm text-[#6e6e73]">{item.memo}</p>
                          )}
                        </button>
                        {item.placeName.trim() && (
                          <div className="mt-2">
                            <p className="text-sm text-[#6e6e73]">
                              📍 {item.placeName}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                void openDirectionsForScheduleItem(item);
                              }}
                              className="mt-1 text-sm font-medium text-[#0A84FF] hover:underline"
                            >
                              🧭 길찾기
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}

      <ScheduleModal
        isOpen={isModalOpen}
        editingItem={editingItem}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}

/**
 * 일정 탭 — TripDetailData.events / places 사용
 */
export default function ScheduleTab({ trip }: ScheduleTabProps) {
  return <ScheduleTabContent trip={trip} />;
}
