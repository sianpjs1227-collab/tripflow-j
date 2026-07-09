import type { Trip } from "@/types/trip";
import { isCompletedTrip } from "@/lib/trip-status";

/**
 * 향후 '여행 앨범' 화면용 완료 여행 목록.
 * Home 화면에서는 표시하지 않으며, 앨범 기능 추가 시 이 모듈을 확장합니다.
 */
export function getCompletedTripsForAlbum(trips: Trip[]): Trip[] {
  return trips.filter((trip) => isCompletedTrip(trip.status));
}
