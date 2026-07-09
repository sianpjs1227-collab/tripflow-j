"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button, Text } from "@/components/ui";

/**
 * 개발용 최소 로그인 UI — Home 디자인에 영향 없음 (fixed 오버레이)
 */
export default function AuthDevBar() {
  const { mode, user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-[min(100vw-2rem,320px)] flex-col items-end gap-2"
      aria-label="인증 개발 패널"
    >
      <div className="pointer-events-auto rounded-2xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
        <Text variant="caption" className="text-muted">
          Auth · {mode === "supabase" ? "Supabase" : "LocalStorage"}
        </Text>
        {user ? (
          <div className="mt-2 space-y-2">
            <Text variant="caption" className="line-clamp-1 block max-w-[260px]">
              {user.display_name ?? user.email ?? user.id}
            </Text>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void signOut()}
              className="h-8 w-full text-xs"
            >
              로그아웃
            </Button>
          </div>
        ) : mode === "supabase" ? (
          <Button
            type="button"
            size="sm"
            onClick={() => void signInWithGoogle()}
            className="mt-2 h-8 w-full text-xs"
          >
            Google 로그인 (Dev)
          </Button>
        ) : (
          <Text variant="caption" className="mt-1 block text-muted">
            Supabase 미연결 — LocalStorage 모드
          </Text>
        )}
      </div>
    </div>
  );
}
