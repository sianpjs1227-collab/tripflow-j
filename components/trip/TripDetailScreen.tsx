"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Share2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTrips } from "@/contexts/TripContext";
import type { CreateTripInput, Trip, TripTab } from "@/types/trip";
import { TripDetailProvider } from "@/contexts/TripDetailContext";
import { getMyMapsConnectionFromTrip } from "@/lib/trip-maps";
import { fetchMyTripMemberRole } from "@/lib/supabase-trip-members";
import { Button, PageContainer } from "@/components/ui";
import { STICKY_LAYER_VARS, useStickyLayer } from "@/hooks/useStickyLayer";
import CreateTripModal from "./CreateTripModal";
import TripInfoCard from "./TripInfoCard";
import TripInviteSheet from "./TripInviteSheet";
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
  const { mode: authMode, user } = useAuth();
  const { updateTrip, deleteTrip, getTripById } = useTrips();
  const headerRef = useStickyLayer(STICKY_LAYER_VARS.header);
  const [activeTab, setActiveTab] = useState<TripTab>("schedule");
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isMyMapsSheetOpen, setIsMyMapsSheetOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const currentTrip = getTripById(trip.id) ?? trip;
  const myMapsUrl =
    getMyMapsConnectionFromTrip(currentTrip)?.viewerUrl ?? "";

  useEffect(() => {
    let cancelled = false;

    async function loadOwnerRole() {
      if (authMode !== "supabase" || !user) {
        if (!cancelled) setIsOwner(false);
        return;
      }

      try {
        const role = await fetchMyTripMemberRole(currentTrip.id, user.id);
        if (!cancelled) setIsOwner(role === "owner");
      } catch (error) {
        console.error("[TripFlow Invite] role load failed", error);
        if (!cancelled) setIsOwner(false);
      }
    }

    void loadOwnerRole();

    return () => {
      cancelled = true;
    };
  }, [authMode, user, currentTrip.id]);

  const handleSettingsAction = (action: TripSettingsMenuAction) => {
    switch (action) {
      case "share-trip":
        setIsInviteSheetOpen(true);
        break;
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
          className="sticky-layer-header -mx-4 bg-background/95 px-4 pb-1 backdrop-blur-md sm:-mx-5 sm:px-5"
        >
          <div className="flex items-center justify-between gap-2 pt-2 pb-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              홈으로
            </Link>

            <div className="flex items-center gap-0.5">
              {isOwner && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsInviteSheetOpen(true)}
                  className="h-8 w-8 p-0 text-muted"
                  aria-label="여행 공유"
                >
                  <Share2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              )}
              <TripMoreMenu
                isOpen={isMoreMenuOpen}
                isOwner={isOwner}
                onOpen={() => setIsMoreMenuOpen(true)}
                onClose={() => setIsMoreMenuOpen(false)}
                onSelect={handleSettingsAction}
              />
            </div>
          </div>

          <section>
            <TripInfoCard
              trip={currentTrip}
              isOwner={isOwner}
              myMapsUrl={myMapsUrl}
              onOpenMyMapsManage={() => setIsMyMapsSheetOpen(true)}
              onOpenShare={() => setIsInviteSheetOpen(true)}
              onEditTrip={() => setIsEditModalOpen(true)}
            />
          </section>
        </div>

        <TripTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="pt-2">
          <div key={activeTab} className="animate-fade-in space-y-3">
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
      />

      <TripInviteSheet
        tripId={currentTrip.id}
        tripLabel={currentTrip.city}
        isOpen={isInviteSheetOpen}
        onClose={() => setIsInviteSheetOpen(false)}
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
