import { getSupabaseClient, logSupabaseQueryResult } from "@/lib/supabase";
import type { TripInvite, TripInvitePreview } from "@/types/trip-invite";
import type {
  SupabaseTripInviteInsert,
  SupabaseTripInviteRow,
} from "@/types/supabase-trip-invite";

const DEFAULT_EXPIRE_DAYS = 30;
const AUTH_NEXT_STORAGE_KEY = "tripflow-auth-next";

export type TripInviteLinkErrorCode =
  | "not_found"
  | "trip_missing"
  | "expired"
  | "not_authenticated"
  | "not_owner"
  | "unknown";

function generateInviteToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

function rowToInvite(row: SupabaseTripInviteRow): TripInvite {
  return {
    id: row.id,
    tripId: row.trip_id,
    token: row.token,
    createdBy: row.created_by,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    createdAt: row.created_at,
  };
}

export function buildTripInviteUrl(token: string, origin?: string): string {
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/invite/${token}`;
}

export function setAuthNextPath(path: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(AUTH_NEXT_STORAGE_KEY, path);
  } catch {
    // ignore
  }
}

export function consumeAuthNextPath(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(AUTH_NEXT_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_NEXT_STORAGE_KEY);
    return value;
  } catch {
    return null;
  }
}

/** Owner: 초대 링크 생성 (기본 만료 30일) */
export async function createTripInviteLink(
  tripId: string,
  createdBy: string,
  expireDays = DEFAULT_EXPIRE_DAYS,
): Promise<TripInvite> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expireDays);

  const row: SupabaseTripInviteInsert = {
    trip_id: tripId,
    token: generateInviteToken(),
    created_by: createdBy,
    expires_at: expiresAt.toISOString(),
  };

  const { data, error } = await client
    .from("trip_invites")
    .insert(row)
    .select("*")
    .single();

  logSupabaseQueryResult("trip_invites.insert", { tripId, row, data }, error);
  if (error) throw error;

  return rowToInvite(data as SupabaseTripInviteRow);
}

/** 초대 미리보기 (비회원도 가능) */
export async function fetchTripInvitePreview(
  token: string,
): Promise<
  | { ok: true; preview: TripInvitePreview }
  | { ok: false; code: TripInviteLinkErrorCode }
> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client.rpc("get_trip_invite_preview", {
    p_token: token,
  });

  logSupabaseQueryResult("trip_invites.preview", { token, data }, error);
  if (error) throw error;

  const payload = (data ?? {}) as {
    ok?: boolean;
    code?: string;
    trip_id?: string;
    title?: string;
    country?: string;
    city?: string;
    owner_name?: string;
    expires_at?: string;
    expired?: boolean;
    already_member?: boolean;
  };

  if (!payload.ok || !payload.trip_id) {
    const code = payload.code;
    if (code === "not_found" || code === "trip_missing") {
      return { ok: false, code };
    }
    return { ok: false, code: "unknown" };
  }

  return {
    ok: true,
    preview: {
      tripId: payload.trip_id,
      title: payload.title ?? "",
      country: payload.country ?? "",
      city: payload.city ?? "",
      ownerName: payload.owner_name ?? "여행 소유자",
      expiresAt: payload.expires_at ?? "",
      expired: Boolean(payload.expired),
      alreadyMember: Boolean(payload.already_member),
    },
  };
}

export type AcceptTripInviteResult =
  | { ok: true; tripId: string; code: "joined" | "already_member" }
  | { ok: false; code: TripInviteLinkErrorCode };

/** 로그인 사용자: 초대 수락 → editor 멤버십 */
export async function acceptTripInvite(
  token: string,
): Promise<AcceptTripInviteResult> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client.rpc("accept_trip_invite", {
    p_token: token,
  });

  logSupabaseQueryResult("trip_invites.accept", { token, data }, error);
  if (error) throw error;

  const payload = (data ?? {}) as {
    ok?: boolean;
    code?: string;
    trip_id?: string;
  };

  if (payload.ok && payload.trip_id) {
    return {
      ok: true,
      tripId: payload.trip_id,
      code: payload.code === "already_member" ? "already_member" : "joined",
    };
  }

  const code = payload.code;
  if (
    code === "not_found" ||
    code === "expired" ||
    code === "not_authenticated"
  ) {
    return { ok: false, code };
  }

  return { ok: false, code: "unknown" };
}

export function getTripInviteLinkErrorMessage(
  code: TripInviteLinkErrorCode,
): string {
  switch (code) {
    case "not_found":
      return "유효하지 않은 초대 링크입니다.";
    case "trip_missing":
      return "초대된 여행을 찾을 수 없습니다.";
    case "expired":
      return "만료된 초대 링크입니다. 새 링크를 요청해주세요.";
    case "not_authenticated":
      return "참여하려면 Google 로그인이 필요합니다.";
    case "not_owner":
      return "여행 소유자만 초대 링크를 만들 수 있습니다.";
    default:
      return "초대 처리에 실패했습니다. 잠시 후 다시 시도해주세요.";
  }
}
