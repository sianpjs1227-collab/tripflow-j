"use client";

import { useState } from "react";
import type { AddPlaceToScheduleInput, Place, PlaceInput } from "@/types/place";
import { useTripDetail } from "@/contexts/TripDetailContext";
import { buildEventFromPlace } from "@/lib/event-utils";
import { createPlace, groupPlacesByCategory, updatePlace } from "@/lib/place-utils";
import type { GeoPosition } from "@/lib/directions";
import PlaceModal from "./PlaceModal";
import PlaceDetailModal from "./PlaceDetailModal";
import PlaceCategorySection from "./PlaceCategorySection";
import AddPlaceToScheduleModal from "./AddPlaceToScheduleModal";
import KmlImportButton from "./KmlImportButton";
import NearbyPlacesButton from "./NearbyPlacesButton";
import NearbyPlacesResults from "./NearbyPlacesResults";

/**
 * 장소 탭 — 후보 장소 저장소 (카테고리별 그룹)
 */
export default function PlacesTab() {
  const { data, updateData } = useTripDetail();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [scheduleTargetPlace, setScheduleTargetPlace] = useState<Place | null>(
    null,
  );
  const [isNearbyView, setIsNearbyView] = useState(false);
  const [nearbyPosition, setNearbyPosition] = useState<GeoPosition | null>(
    null,
  );

  const groupedPlaces = groupPlacesByCategory(data.places);

  const handleOpenNearby = (position: GeoPosition) => {
    setNearbyPosition(position);
    setIsNearbyView(true);
  };

  const handleCloseNearby = () => {
    setIsNearbyView(false);
  };

  const handleSavePlace = (input: PlaceInput) => {
    updateData((prev) => {
      if (editingPlace) {
        return {
          ...prev,
          places: prev.places.map((p) =>
            p.id === editingPlace.id ? updatePlace(p, input) : p,
          ),
        };
      }
      return {
        ...prev,
        places: [...prev.places, createPlace(input)],
      };
    });
    setEditingPlace(null);
  };

  const handleDeletePlace = (place: Place) => {
    updateData((prev) => ({
      ...prev,
      places: prev.places.filter((p) => p.id !== place.id),
    }));
    setSelectedPlace(null);
  };

  const handleAddToSchedule = (input: AddPlaceToScheduleInput) => {
    if (!scheduleTargetPlace) return;

    updateData((prev) => {
      const event = buildEventFromPlace(
        scheduleTargetPlace,
        input.date,
        input.time,
      );
      return {
        ...prev,
        events: [...prev.events, event],
      };
    });
    setScheduleTargetPlace(null);
    setSelectedPlace(null);
  };

  const openEditFromDetail = (place: Place) => {
    setSelectedPlace(null);
    setEditingPlace(place);
    setIsAddModalOpen(true);
  };

  const openAddModal = () => {
    setEditingPlace(null);
    setIsAddModalOpen(true);
  };

  const closePlaceModal = () => {
    setIsAddModalOpen(false);
    setEditingPlace(null);
  };

  return (
    <div className="p-6">
      {/* 기존 장소 목록 — hidden 으로 숨겨 마운트 유지 (접기/펼치기 상태 보존) */}
      <div className={isNearbyView ? "hidden" : undefined} aria-hidden={isNearbyView}>
        <h2 className="text-lg font-semibold">장소</h2>
        <p className="mt-2 text-sm text-[#6e6e73]">
          가보고 싶은 장소를 저장하고 일정에 추가하세요.
        </p>

        <div className="mt-4">
          <NearbyPlacesButton onOpen={handleOpenNearby} />
        </div>

        <div className="mt-4">
          <KmlImportButton />
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="mt-3 w-full rounded-xl bg-[#0A84FF] py-3 text-sm font-semibold text-white"
        >
          장소 추가
        </button>

        {data.places.length === 0 ? (
          <p className="mt-6 text-sm text-[#6e6e73]">
            아직 저장된 장소가 없습니다.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {groupedPlaces.map((group) => (
              <PlaceCategorySection
                key={group.category}
                category={group.category}
                places={group.places}
                onPlaceClick={setSelectedPlace}
              />
            ))}
          </div>
        )}
      </div>

      {isNearbyView && nearbyPosition && (
        <NearbyPlacesResults
          places={data.places}
          userPosition={nearbyPosition}
          onClose={handleCloseNearby}
        />
      )}

      <PlaceModal
        isOpen={isAddModalOpen}
        editingPlace={editingPlace}
        onClose={closePlaceModal}
        onSave={handleSavePlace}
      />

      <PlaceDetailModal
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
        onAddToSchedule={(place) => {
          setSelectedPlace(null);
          setScheduleTargetPlace(place);
        }}
        onEdit={openEditFromDetail}
        onDelete={handleDeletePlace}
      />

      <AddPlaceToScheduleModal
        isOpen={scheduleTargetPlace !== null}
        place={scheduleTargetPlace}
        onClose={() => setScheduleTargetPlace(null)}
        onSave={handleAddToSchedule}
      />
    </div>
  );
}
