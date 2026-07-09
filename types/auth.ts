/** Supabase 로그인 사용자 (앱에서 사용하는 형태) */
export interface AuthUser {
  id: string;
  email: string | null;
  avatar_url: string | null;
  display_name: string | null;
}

/** 인증 모드 — Supabase 연결 실패 시 local 로 폴백 */
export type AuthMode = "supabase" | "local";
