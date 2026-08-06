/**
 * 로컬에서 제거했지만 Supabase delete 가 아직 확정되지 않은 place id.
 * loadDetail merge 가 remote 의 동일 id 를 다시 살리지 않도록 막는다.
 * sessionStorage 에 보관해 새로고침 직후에도 유지한다.
 */

const STORAGE_KEY = "tripflow-pending-place-deletes";

type PendingStore = Record<string, string[]>;

const pendingDeletedPlaceIds = new Set<string>();

function readStore(): PendingStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PendingStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: PendingStore): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota / private mode
  }
}

function hydrateFromSession(): void {
  if (typeof window === "undefined") return;
  const store = readStore();
  for (const ids of Object.values(store)) {
    for (const id of ids) {
      pendingDeletedPlaceIds.add(id);
    }
  }
}

hydrateFromSession();

function persistId(id: string): void {
  const store = readStore();
  // trip 단위 키가 없어도 id 집합으로 충분 (place id 는 uuid)
  const all = new Set<string>([
    ...Object.values(store).flat(),
    ...pendingDeletedPlaceIds,
    id,
  ]);
  writeStore({ _: [...all] });
}

function persistRemove(ids: string[]): void {
  const remove = new Set(ids);
  const store = readStore();
  const remaining = [
    ...new Set([...Object.values(store).flat(), ...pendingDeletedPlaceIds]),
  ].filter((id) => !remove.has(id));
  writeStore(remaining.length > 0 ? { _: remaining } : {});
}

export function notePendingPlaceDeletions(ids: string[]): void {
  if (ids.length === 0) return;
  for (const id of ids) {
    pendingDeletedPlaceIds.add(id);
    persistId(id);
  }
  console.log("[places.pendingDeletes] note", {
    added: ids,
    pending: [...pendingDeletedPlaceIds],
  });
}

export function clearPendingPlaceDeletions(ids: string[]): void {
  if (ids.length === 0) return;
  for (const id of ids) {
    pendingDeletedPlaceIds.delete(id);
  }
  persistRemove(ids);
  console.log("[places.pendingDeletes] clear", {
    cleared: ids,
    pending: [...pendingDeletedPlaceIds],
  });
}

export function getPendingPlaceDeletions(): string[] {
  hydrateFromSession();
  return [...pendingDeletedPlaceIds];
}

export function isPendingPlaceDeletion(id: string): boolean {
  if (pendingDeletedPlaceIds.has(id)) return true;
  hydrateFromSession();
  return pendingDeletedPlaceIds.has(id);
}
