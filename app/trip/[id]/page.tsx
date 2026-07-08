import TripPageClient from "@/components/trip/TripPageClient";

interface TripPageProps {
  params: Promise<{ id: string }>;
}

/** 여행 상세 페이지 — /trip/[id] */
export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params;
  return <TripPageClient tripId={id} />;
}
