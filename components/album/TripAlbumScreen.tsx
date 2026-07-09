"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTrips } from "@/contexts/TripContext";
import type { CreateTripInput, Trip } from "@/types/trip";
import { getCompletedTripsForAlbum } from "@/lib/trip-album";
import { PageContainer, Text } from "@/components/ui";
import TripListSection from "@/components/home/TripListSection";
import CreateTripModal from "@/components/trip/CreateTripModal";

/** 완료한 여행 앨범 화면 */
export default function TripAlbumScreen() {
  const { trips, updateTrip, deleteTrip } = useTrips();
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const completedTrips = useMemo(
    () => getCompletedTripsForAlbum(trips),
    [trips],
  );

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
    }
  };

  const handleDelete = (trip: Trip) => {
    deleteTrip(trip.id);
  };

  return (
    <div className="relative min-h-full bg-background">
      <PageContainer
        constrained
        className="relative flex min-h-full max-w-lg flex-col gap-8 pb-16 pt-8 sm:mx-auto sm:max-w-2xl sm:pt-10 lg:max-w-3xl"
      >
        <header className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-background"
            aria-label="홈으로 돌아가기"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div>
            <Text variant="caption" className="font-medium uppercase tracking-wide text-primary">
              TripFlow J
            </Text>
            <Text variant="title-sm" as="h1" className="text-2xl font-bold tracking-tight">
              여행 앨범
            </Text>
          </div>
        </header>

        <Text variant="muted" className="-mt-4 text-sm leading-relaxed">
          완료한 여행을 모아보세요. 추억과 기록을 다시 확인할 수 있습니다.
        </Text>

        {completedTrips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <Text variant="body-medium" className="font-semibold">
              아직 완료한 여행이 없어요
            </Text>
            <Text variant="muted" className="mt-2 text-sm">
              여행이 끝나면 자동으로 여기에 표시됩니다.
            </Text>
            <Link
              href="/"
              className="mt-6 inline-flex text-sm font-semibold text-primary hover:underline"
            >
              홈으로 돌아가기
            </Link>
          </div>
        ) : (
          <TripListSection
            title="완료한 여행"
            headingId="album-completed-trips"
            trips={completedTrips}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        )}
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
