"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTrips } from "@/contexts/TripContext";
import type { CreateTripInput, Trip, TripTab } from "@/types/trip";
import { TripDetailProvider } from "@/contexts/TripDetailContext";
import { isDepartingToday } from "@/lib/trip-lifecycle";
import { tripStatusDisplay } from "@/lib/trip-status";
import { loadMyMapsLink, openMapsUrl } from "@/lib/trip-maps";
import {
  Button,
  Card,
  CountryFlag,
  PageContainer,
  Text,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { STICKY_LAYER_VARS, useStickyLayer } from "@/hooks/useStickyLayer";
import CreateTripModal from "./CreateTripModal";
import TripMoreMenu, {
  type TripSettingsMenuAction,
} from "./TripMoreMenu";
import TripMyMapsManageSheet from "./TripMyMapsManageSheet";
import TripTabContent from "./TripTabContent";
import TripTabs from "./TripTabs";

interface TripDetailScreenProps {
  trip: Trip;
}

function TripDetailContent({ trip }: TripDetailScreenProps) {
  const router = useRouter();
  const { updateTrip, deleteTrip, getTripById } = useTrips();
  const headerRef = useStickyLayer(STICKY_LAYER_VARS.header);
  const [activeTab, setActiveTab] = useState<TripTab>("schedule");
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isMyMapsSheetOpen, setIsMyMapsSheetOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [myMapsUrl, setMyMapsUrl] = useState("");

  const currentTrip = getTripById(trip.id) ?? trip;
  const showDepartingToday = isDepartingToday(currentTrip.startDate);
  const isMyMapsConnected = Boolean(myMapsUrl);

  useEffect(() => {
    setMyMapsUrl(loadMyMapsLink(currentTrip.id));
  }, [currentTrip.id, isMyMapsSheetOpen]);

  const refreshMyMapsLink = () => {
    setMyMapsUrl(loadMyMapsLink(currentTrip.id));
  };

  const handleSettingsAction = (action: TripSettingsMenuAction) => {
    switch (action) {
      case "edit-trip":
        setIsEditModalOpen(true);
        break;
      case "manage-mymaps":
        setIsMyMapsSheetOpen(true);
        break;
      case "delete-trip":
        if (!confirm(`"${currentTrip.city}" 여행을 삭제할까요?`)) return;
        deleteTrip(currentTrip.id);
        router.push("/");
        break;
    }
  };

  const handleSaveTrip = (input: CreateTripInput) => {
    updateTrip(currentTrip.id, input);
  };

  return (
    <div className="min-h-full bg-background">
      <PageContainer constrained className="pb-10">
        <div
          ref={headerRef}
          className="sticky-layer-header -mx-4 bg-background/95 px-4 pb-2 backdrop-blur-md sm:-mx-5 sm:px-5"
        >
          <div className="flex items-center justify-between gap-3 pt-3 pb-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              홈으로
            </Link>

            <TripMoreMenu
              isOpen={isMoreMenuOpen}
              onOpen={() => setIsMoreMenuOpen(true)}
              onClose={() => setIsMoreMenuOpen(false)}
              onSelect={handleSettingsAction}
            />
          </div>

          <section>
            <Card padding="md" className="overflow-hidden">
            <div className="flex items-start gap-2.5">
              <CountryFlag
                code={currentTrip.countryCode}
                className="text-2xl leading-none"
                label={currentTrip.country}
              />
              <div className="min-w-0 flex-1">
                <Text variant="caption" className="font-medium">
                  {currentTrip.country}
                </Text>
                <Text
                  variant="title-sm"
                  as="h1"
                  className="text-xl font-bold leading-tight"
                >
                  {currentTrip.city}
                </Text>
                {currentTrip.name.trim() &&
                  currentTrip.name !== currentTrip.city && (
                    <Text variant="caption" className="mt-0.5">
                      {currentTrip.name}
                    </Text>
                  )}
              </div>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl bg-background px-2.5 py-2">
                <Text variant="caption" as="dt">
                  기간
                </Text>
                <Text variant="body-medium" as="dd" className="mt-0.5 text-xs font-semibold">
                  {currentTrip.startDate} ~ {currentTrip.endDate}
                </Text>
              </div>
              <div className="rounded-xl bg-background px-2.5 py-2">
                <Text variant="caption" as="dt">
                  여행일수
                </Text>
                <Text variant="body-medium" as="dd" className="mt-0.5 text-xs font-semibold">
                  {currentTrip.duration}
                </Text>
              </div>
              <div className="col-span-2 flex flex-wrap items-center gap-1.5 sm:col-span-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                    currentTrip.status === "PLANNING" &&
                      "bg-success/10 text-success",
                    currentTrip.status === "TRAVELING" &&
                      "bg-warning/10 text-warning",
                    currentTrip.status === "COMPLETED" &&
                      "bg-muted/15 text-muted",
                  )}
                >
                  {tripStatusDisplay[currentTrip.status]}
                </span>
                {showDepartingToday && (
                  <span className="inline-flex rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
                    🛫 오늘 출발
                  </span>
                )}
              </div>
            </dl>

            <span
              className="mt-3 inline-flex w-full"
              title={
                !isMyMapsConnected
                  ? "Google My Maps를 먼저 연결하세요."
                  : undefined
              }
            >
              <Button
                type="button"
                variant="secondary"
                disabled={!isMyMapsConnected}
                onClick={() => myMapsUrl && openMapsUrl(myMapsUrl)}
                className="w-full"
              >
                🗺 My Maps 열기
              </Button>
            </span>
          </Card>
        </section>
        </div>

        <TripTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="pt-3">
          <div key={activeTab} className="animate-fade-in space-y-4">
            <TripTabContent trip={currentTrip} activeTab={activeTab} />
          </div>
        </main>
      </PageContainer>

      <CreateTripModal
        isOpen={isEditModalOpen}
        editingTrip={currentTrip}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveTrip}
      />

      <TripMyMapsManageSheet
        tripId={currentTrip.id}
        isOpen={isMyMapsSheetOpen}
        onClose={() => setIsMyMapsSheetOpen(false)}
        onConnectionChange={refreshMyMapsLink}
      />
    </div>
  );
}

/** 여행 상세 페이지 화면 */
export default function TripDetailScreen({ trip }: TripDetailScreenProps) {
  return (
    <TripDetailProvider tripId={trip.id}>
      <TripDetailContent trip={trip} />
    </TripDetailProvider>
  );
}
