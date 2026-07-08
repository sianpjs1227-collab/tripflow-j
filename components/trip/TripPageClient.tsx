"use client";

import Link from "next/link";
import { useTrips } from "@/contexts/TripContext";
import TripDetailScreen from "./TripDetailScreen";

interface TripPageClientProps {
  tripId: string;
}

/** /trip/[id] 페이지 클라이언트 래퍼 — Context에서 여행 데이터 조회 */
export default function TripPageClient({ tripId }: TripPageClientProps) {
  const { getTripById } = useTrips();
  const trip = getTripById(tripId);

  if (!trip) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6">
        <p className="text-[#6e6e73]">여행을 찾을 수 없습니다.</p>
        <Link href="/" className="text-[#0A84FF] hover:underline">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return <TripDetailScreen trip={trip} />;
}
