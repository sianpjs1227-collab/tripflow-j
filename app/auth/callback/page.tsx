"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { consumeAuthNextPath } from "@/lib/supabase-trip-invite-links";
import { Text } from "@/components/ui";

/** Google OAuth 리다이렉트 콜백 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      const client = getSupabaseClient();
      if (!client) {
        router.replace("/");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await client.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("[TripFlow Auth] 세션 교환 실패:", error.message);
        }
      } else {
        await client.auth.getSession();
      }

      const nextPath = consumeAuthNextPath();
      const safeNext =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/";
      router.replace(safeNext);
    }

    void handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <Text variant="muted">로그인 처리 중...</Text>
    </div>
  );
}
