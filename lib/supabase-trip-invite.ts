import { getSupabaseClient, logSupabaseQueryResult } from "@/lib/supabase";
import type { TripMemberRole } from "@/types/trip-member";

export type TripInviteErrorCode =
  | "not_authenticated"
  | "invalid_email"
  | "not_owner"
  | "not_found"
  | "already_member"
  | "unknown";

export type TripInviteResult =
  | { ok: true; userId: string; role: TripMemberRole }
  | { ok: false; code: TripInviteErrorCode };

interface InviteRpcPayload {
  ok?: boolean;
  code?: string;
  user_id?: string;
  role?: TripMemberRole;
}

const ERROR_CODES: TripInviteErrorCode[] = [
  "not_authenticated",
  "invalid_email",
  "not_owner",
  "not_found",
  "already_member",
];

function normalizeInviteErrorCode(code: string | undefined): TripInviteErrorCode {
  if (code && ERROR_CODES.includes(code as TripInviteErrorCode)) {
    return code as TripInviteErrorCode;
  }
  return "unknown";
}

/** Owner가 이메일로 사용자를 editor 로 초대 */
export async function inviteTripMemberByEmail(
  tripId: string,
  email: string,
): Promise<TripInviteResult> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client.rpc("invite_trip_member_by_email", {
    p_trip_id: tripId,
    p_email: email.trim(),
  });

  logSupabaseQueryResult(
    "trip_members.invite_by_email",
    { tripId, email, data },
    error,
  );
  if (error) throw error;

  const payload = (data ?? {}) as InviteRpcPayload;

  if (payload.ok === true && payload.user_id) {
    return {
      ok: true,
      userId: payload.user_id,
      role: payload.role ?? "editor",
    };
  }

  return {
    ok: false,
    code: normalizeInviteErrorCode(payload.code),
  };
}

export function getTripInviteErrorMessage(code: TripInviteErrorCode): string {
  switch (code) {
    case "not_found":
      return "해당 이메일로 가입한 사용자를 찾을 수 없습니다. Google로 로그인한 계정만 초대할 수 있습니다.";
    case "already_member":
      return "이미 이 여행에 참여 중인 사용자입니다.";
    case "invalid_email":
      return "올바른 이메일 주소를 입력해주세요.";
    case "not_owner":
      return "여행 소유자만 초대할 수 있습니다.";
    case "not_authenticated":
      return "로그인이 필요합니다.";
    default:
      return "초대에 실패했습니다. 잠시 후 다시 시도해주세요.";
  }
}
