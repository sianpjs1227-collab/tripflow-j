"use client";

import { useState } from "react";
import { useTrips } from "@/contexts/TripContext";
import type { CreateTripInput, Trip } from "@/types/trip";
import BrandHeader from "./BrandHeader";
import CreateTripButton from "./CreateTripButton";
import RecentTripsSection from "./RecentTripsSection";
import CreateTripModal from "@/components/trip/CreateTripModal";

/**
 * HomeScreen — TripFlow J 앱의 첫 화면(홈)
 */
export default function HomeScreen() {
  const { trips, addTrip, updateTrip, deleteTrip } = useTrips();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

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
      addTrip(input);
    }
  };

  const handleDelete = (trip: Trip) => {
    deleteTrip(trip.id);
  };

  return (
    <div
      className="
        relative min-h-full
        bg-gradient-to-b from-[#eef6fc] via-[#f7fafd] to-white
        dark:from-[#0d1117] dark:via-[#0a0a0a] dark:to-[#000000]
      "
    >
      <main className="relative mx-auto flex min-h-full max-w-lg flex-col px-7 pb-16 pt-20 sm:px-10 sm:pt-24">
        <BrandHeader />

        <div className="mt-14">
          <CreateTripButton onClick={openCreateModal} />
        </div>

        {trips.length === 0 ? (
          <p className="mt-16 text-center text-sm text-[#6e6e73] dark:text-[#a1a1a6]">
            아직 여행이 없습니다.
          </p>
        ) : (
          <div className="mt-16">
            <RecentTripsSection
              trips={trips}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          </div>
        )}
      </main>

      <CreateTripModal
        isOpen={isModalOpen}
        editingTrip={editingTrip}
        onClose={closeModal}
        onSave={handleSave}
      />
    </div>
  );
}
