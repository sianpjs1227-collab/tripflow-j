"use client";

import Link from "next/link";
import { useState } from "react";
import type { Trip, TripTab } from "@/types/trip";
import { TripDetailProvider } from "@/contexts/TripDetailContext";
import CountryFlag from "@/components/ui/CountryFlag";
import { tripStatusDisplay } from "@/lib/trip-status";
import TripMyMapsSection from "./TripMyMapsSection";
import TripTabContent from "./TripTabContent";
import TripTabs from "./TripTabs";

interface TripDetailScreenProps {
  trip: Trip;
}

function TripDetailContent({ trip }: TripDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<TripTab>("schedule");

  return (
    <div className="min-h-full bg-white dark:bg-black">
      <header className="border-b border-[#ebebeb] px-4 py-4 dark:border-white/10">
        <Link
          href="/"
          className="text-sm text-[#0A84FF] hover:underline"
        >
          ← 홈으로
        </Link>

        <h1 className="mt-2 flex items-center gap-2 text-xl font-bold text-[#111111] dark:text-white">
          <CountryFlag
            code={trip.countryCode}
            className="text-2xl"
            label={trip.country}
          />
          {trip.name}
        </h1>

        <p className="mt-1 text-sm text-[#6e6e73]">
          {trip.country} · {trip.startDate} ~ {trip.endDate} · {trip.duration}
        </p>

        <p className="mt-1 text-sm">{tripStatusDisplay[trip.status]}</p>

        <TripMyMapsSection tripId={trip.id} />
      </header>

      <TripTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <TripTabContent trip={trip} activeTab={activeTab} />
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
