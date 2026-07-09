import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { AuthUser } from "@/types/auth";

let browserClient: SupabaseClient | null = null;

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
