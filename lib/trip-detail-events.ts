type TripDetailListener = () => void;

const tripListeners = new Map<string, Set<TripDetailListener>>();
const tripRevisions = new Map<string, number>();

function getTripListenerSet(tripId: string): Set<TripDetailListener> {
  let listeners = tripListeners.get(tripId);
  if (!listeners) {
    listeners = new Set();
    tripListeners.set(tripId, listeners);
  }
  return listeners;
}

/** useSyncExternalStore용 revision — 상세 데이터 변경마다 증가 */
export function getTripDetailRevision(tripId: string): number {
  return tripRevisions.get(tripId) ?? 0;
}

/** 특정 여행 상세 데이터 변경 구독 */
export function subscribeTripDetailUpdates(
  tripId: string,
  listener: TripDetailListener,
): () => void {
  const listeners = getTripListenerSet(tripId);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      tripListeners.delete(tripId);
    }
  };
}

/** TripDetailContext 등에서 상세 데이터 저장 후 호출 */
export function notifyTripDetailUpdated(tripId: string): void {
  tripRevisions.set(tripId, (tripRevisions.get(tripId) ?? 0) + 1);
  getTripListenerSet(tripId).forEach((listener) => listener());
}
