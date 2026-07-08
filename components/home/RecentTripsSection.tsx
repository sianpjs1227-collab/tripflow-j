import type { Trip } from "@/types/trip";
import TripCard from "./TripCard";

interface RecentTripsSectionProps {
  trips: Trip[];
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
}

/** "내 여행" 영역 */
export default function RecentTripsSection({
  trips,
  onEdit,
  onDelete,
}: RecentTripsSectionProps) {
  return (
    <section
      className="animate-fade-in-up animation-delay-200"
      aria-labelledby="my-trips-heading"
    >
      <div className="mb-5 flex items-baseline justify-between">
        <h2
          id="my-trips-heading"
          className="text-base font-semibold text-[#111111] dark:text-[#f5f5f7]"
        >
          내 여행
        </h2>
        <span className="text-sm text-[#6e6e73] dark:text-[#a1a1a6]">
          {trips.length}개
        </span>
      </div>

      <ul className="flex flex-col gap-4" role="list">
        {trips.map((trip, index) => (
          <li key={trip.id}>
            <TripCard
              trip={trip}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
