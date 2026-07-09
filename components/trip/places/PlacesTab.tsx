"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import type { AddPlaceToScheduleInput, Place, PlaceInput, PlaceTravelRecordInput } from "@/types/place";
import { useTripDetail } from "@/contexts/TripDetailContext";
import { buildEventFromPlace } from "@/lib/event-utils";
import {
  createPlace,
  filterPlacesByActiveFilter,
  filterPlacesByName,
  groupPlacesByCategory,
  updatePlace,
  type PlaceListFilter,
} from "@/lib/place-utils";
import { applyTravelRecord, isPlaceVisited } from "@/lib/place-visit";
import type { GeoPosition } from "@/lib/directions";
import type { NearbyPlace } from "@/lib/nearby-utils";
import { usePlaceFavorites } from "@/hooks/usePlaceFavorites";
import { usePlaceActionSheet } from "@/hooks/usePlaceActionSheet";
import { Button, Text } from "@/components/ui";
import PlaceModal from "./PlaceModal";
import PlaceActionSheet from "@/components/map/PlaceActionSheet";
import PlaceCategorySection from "./PlaceCategorySection";
import PlaceListCard from "./PlaceListCard";
import PlaceCategoryFilter from "./PlaceCategoryFilter";
import PlaceSearchBar from "./PlaceSearchBar";
import AddPlaceToScheduleModal from "./AddPlaceToScheduleModal";
import NearbyPlacesButton from "./NearbyPlacesButton";
import NearbyPlacesResults from "./NearbyPlacesResults";

/**
 * 장소 탭 — 후보 장소 저장소 (카테고리별 그룹)
 */
export default function PlacesTab() {
  const { tripId, data, updateData } = useTripDetail();
  const { favoriteIds, isFavorite, toggleFavorite } =
    usePlaceFavorites(tripId);
  const { previewState, openPlace, closePlace } = usePlaceActionSheet();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [scheduleTargetPlace, setScheduleTargetPlace] = useState<Place | null>(
    null,
  );
  const [isNearbyView, setIsNearbyView] = useState(false);
  const [nearbyPosition, setNearbyPosition] = useState<GeoPosition | null>(
    null,
  );
  const [activeFilter, setActiveFilter] = useState<PlaceListFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const totalFavoriteCount = useMemo(
    () => data.places.filter((place) => favoriteIds.has(place.id)).length,
    [data.places, favoriteIds],
  );

  const visitedCount = useMemo(
    () => data.places.filter((place) => isPlaceVisited(place)).length,
    [data.places],
  );

  const notVisitedCount = useMemo(
    () => data.places.filter((place) => !isPlaceVisited(place)).length,
    [data.places],
  );

  const placesInCategory = useMemo(
    () =>
      filterPlacesByActiveFilter(data.places, activeFilter, favoriteIds),
    [data.places, activeFilter, favoriteIds],
  );

  const searchedPlaces = useMemo(
    () => filterPlacesByName(placesInCategory, searchQuery),
    [placesInCategory, searchQuery],
  );

  const groupedPlaces = useMemo(
    () => groupPlacesByCategory(searchedPlaces),
    [searchedPlaces],
  );

  const isSearching = searchQuery.trim().length > 0;
  const hasListResults = searchedPlaces.length > 0;

  const getPlaceById = (placeId: string) =>
    data.places.find((place) => place.id === placeId);

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

  const handleOpenNearby = (position: GeoPosition) => {
    setNearbyPosition(position);
    setIsNearbyView(true);
  };

  const handleCloseNearby = () => {
    setIsNearbyView(false);
  };

  const handleOpenPlace = (place: Place) => {
    const nearby = place as NearbyPlace;
    if (nearby.distanceMeters != null && nearby.walkingMinutes != null) {
      openPlace(place, {
        distanceMeters: nearby.distanceMeters,
        walkingMinutes: nearby.walkingMinutes,
      });
      return;
    }

    openPlace(place);
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
    <div className="space-y-4">
      <Text variant="title-sm" as="h2">
        장소
      </Text>
      <Text variant="muted" className="mt-2">
        가보고 싶은 장소를 저장하고 일정에 추가하세요.
      </Text>

      <div className="mt-4">
        <PlaceSearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {isNearbyView && (
        <div className="mt-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            내 주변 검색 중
          </span>
        </div>
      )}

      {isNearbyView && nearbyPosition ? (
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCloseNearby}
            className="mt-4 w-full justify-start text-primary"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            전체 장소
          </Button>

          {data.places.length > 0 && (
            <div className="mt-5">
              <PlaceCategoryFilter
                activeFilter={activeFilter}
                favoriteCount={totalFavoriteCount}
                visitedCount={visitedCount}
                notVisitedCount={notVisitedCount}
                onChange={setActiveFilter}
              />
            </div>
          )}

          <NearbyPlacesResults
            places={placesInCategory}
            searchQuery={searchQuery}
            userPosition={nearbyPosition}
            onOpenPlace={handleOpenPlace}
          />
        </>
      ) : (
        <>
          <div className="mt-4">
            <NearbyPlacesButton onOpen={handleOpenNearby} />
          </div>

          <Button type="button" onClick={openAddModal} className="mt-3 w-full">
            장소 추가
          </Button>

          {data.places.length === 0 ? (
            <Text variant="muted" className="mt-6">
              아직 저장된 장소가 없습니다.
            </Text>
          ) : (
            <>
              <div className="mt-5">
                <PlaceCategoryFilter
                  activeFilter={activeFilter}
                  favoriteCount={totalFavoriteCount}
                  visitedCount={visitedCount}
                  notVisitedCount={notVisitedCount}
                  onChange={setActiveFilter}
                />
              </div>

              <div className="mt-4 space-y-4">
                {!hasListResults ? (
                  <Text variant="muted" className="py-8 text-center">
                    {isSearching
                      ? "검색 결과가 없습니다."
                      : activeFilter === "favorites"
                        ? "즐겨찾기한 장소가 없습니다."
                        : activeFilter === "not_visited"
                          ? "방문하지 않은 장소가 없습니다."
                          : activeFilter === "visited"
                            ? "방문한 장소가 없습니다."
                            : activeFilter === "rating_sort"
                              ? "평점이 있는 장소가 없습니다."
                              : "표시할 장소가 없습니다."}
                  </Text>
                ) : activeFilter === "rating_sort" ? (
                  <ul className="space-y-2" role="list">
                    {searchedPlaces.map((place) => (
                      <li key={place.id}>
                        <PlaceListCard
                          place={place}
                          onOpen={handleOpenPlace}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  groupedPlaces.map((group) => (
                    <PlaceCategorySection
                      key={group.category}
                      category={group.category}
                      places={group.places}
                      onOpenPlace={handleOpenPlace}
                      defaultOpen={activeFilter !== "all" || isSearching}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </>
      )}

      <PlaceModal
        isOpen={isAddModalOpen}
        editingPlace={editingPlace}
        onClose={closePlaceModal}
        onSave={handleSavePlace}
      />

      <AddPlaceToScheduleModal
        isOpen={scheduleTargetPlace !== null}
        place={scheduleTargetPlace}
        onClose={() => setScheduleTargetPlace(null)}
        onSave={handleAddToSchedule}
      />

      <PlaceActionSheet
        previewState={previewState}
        onClose={closePlace}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        getPlace={getPlaceById}
        onSaveTravelRecord={handleSaveTravelRecord}
        knownCurrentPosition={nearbyPosition}
        onAddToSchedule={(place) => {
          closePlace();
          setScheduleTargetPlace(place);
        }}
      />
    </div>
  );
}
