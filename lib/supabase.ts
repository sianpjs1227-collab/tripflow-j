import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { AuthUser } from "@/types/auth";

let browserClient: SupabaseClient | null = null;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Supabase 환경변수가 설정되어 있는지 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

/** 브라우저용 Supabase 클라이언트 (싱글톤) */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (typeof window === "undefined") return null;

  if (!browserClient) {
    try {
      browserClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        },
      );
    } catch {
      browserClient = null;
    }
  }

  return browserClient;
}

/** Supabase User → 앱 AuthUser */
export function mapSupabaseUser(user: User): AuthUser {
  const metadata = user.user_metadata ?? {};

  return {
    id: user.id,
    email: user.email ?? null,
    avatar_url:
      (metadata.avatar_url as string | undefined) ??
      (metadata.picture as string | undefined) ??
      null,
    display_name:
      (metadata.display_name as string | undefined) ??
      (metadata.full_name as string | undefined) ??
      (metadata.name as string | undefined) ??
      user.email ??
      null,
  };
}

/** Supabase 연결 가능 여부 확인 (간단한 health check) */
export async function checkSupabaseConnection(
  client: SupabaseClient,
): Promise<boolean> {
  try {
    const { error } = await client.auth.getSession();
    return !error;
  } catch {
    return false;
  }
}

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
} | null;

export function logSupabaseQueryResult(
  label: string,
  payload: unknown,
  error?: SupabaseErrorLike,
): void {
  console.log(`[Supabase Query] ${label}`);
  console.log("payload:", payload);

  if (error) {
    // Next.js overlay는 console.error 첫 인자만 크게 보여주므로
    // message/code/details/hint 를 한 문자열로도 남긴다.
    console.error(
      [
        `[Supabase Query Error] ${label}`,
        `message: ${error?.message ?? null}`,
        `code: ${error?.code ?? null}`,
        `details: ${error?.details ?? null}`,
        `hint: ${error?.hint ?? null}`,
      ].join("\n"),
    );
    console.error("message:", error?.message ?? null);
    console.error("code:", error?.code ?? null);
    console.error("details:", error?.details ?? null);
    console.error("hint:", error?.hint ?? null);
    console.dir(error, { depth: null });
  }
}
