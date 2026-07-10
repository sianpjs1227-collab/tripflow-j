"use client";

import { useMemo, useState } from "react";
import { useTrips } from "@/contexts/TripContext";
import type { CreateTripInput, Trip } from "@/types/trip";
import { createDefaultChecklistItems } from "@/lib/checklist-utils";
import { getCompletedTripsForAlbum } from "@/lib/trip-album";
import { saveTripDetailData } from "@/lib/trip-detail-storage";
import { createEmptyTripDetailData } from "@/types/trip-detail";
import {
  getHomeCarouselTrips,
  hasActiveHomeTrips,
} from "@/lib/trip-home-utils";
import { PageContainer } from "@/components/ui";
import HomeGreeting from "./HomeGreeting";
import HomeWelcomeHero from "./HomeWelcomeHero";
import HomeHeroCarousel from "./HomeHeroCarousel";
import CreateTripButton from "./CreateTripButton";
import HomeAlbumCard from "./HomeAlbumCard";
import CreateTripModal from "@/components/trip/CreateTripModal";
import PwaInstallButton from "@/components/pwa/PwaInstallButton";
import { HOME_CARD_STACK_CLASS } from "./home-layout";

/** TripFlow J 앱 홈 화면 */
export default function HomeScreen() {
  const { trips, addTrip, updateTrip, deleteTrip } = useTrips();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const carouselTrips = useMemo(() => getHomeCarouselTrips(trips), [trips]);
  const completedTrips = useMemo(
    () => getCompletedTripsForAlbum(trips),
    [trips],
  );
  const hasNoTrips = trips.length === 0;
  const showCarousel = hasActiveHomeTrips(trips);

  const openCreateModal = () => {
    setEditingTrip(null);
    setIsModalOpen(true);
  };

  const openEditModal = (trip: Trip) => {
    setEditingTrip(trip);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTrip(null);
  };

  const handleSave = (input: CreateTripInput) => {
    if (editingTrip) {
      updateTrip(editingTrip.id, input);
    } else {
      const newTrip = addTrip(input);
      const detail = createEmptyTripDetailData();
      if (input.includeDefaultChecklist !== false) {
        detail.checklist = createDefaultChecklistItems();
      }
      saveTripDetailData(newTrip.id, detail);
    }
  };

  const handleDelete = (trip: Trip) => {
    deleteTrip(trip.id);
  };

  return (
    <div className="relative min-h-full bg-background">
      <PwaInstallButton />

      <PageContainer
        constrained
        className="relative flex min-h-full flex-col gap-8 pb-20 pt-10 sm:mx-auto sm:pt-14"
      >
        {!hasNoTrips && <HomeGreeting />}

        <div className={HOME_CARD_STACK_CLASS}>
          {hasNoTrips ? (
            <HomeWelcomeHero onCreateTrip={openCreateModal} />
          ) : showCarousel ? (
            <>
              <HomeHeroCarousel
                trips={carouselTrips}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
              <CreateTripButton onClick={openCreateModal} />
            </>
          ) : (
            <CreateTripButton onClick={openCreateModal} />
          )}

          <HomeAlbumCard completedCount={completedTrips.length} />
        </div>
      </PageContainer>

      <CreateTripModal
        isOpen={isModalOpen}
        editingTrip={editingTrip}
        onClose={closeModal}
        onSave={handleSave}
      />
    </div>
  );
}
