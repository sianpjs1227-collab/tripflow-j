"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Text } from "@/components/ui";

/**
 * Home 전용 인증 패널 — 여행 상세 등 다른 화면에서는 숨김
 * 로그인 전: Google 로그인 / 로그인 후: 프로필·로그아웃
 */
export default function AuthDevBar() {
  const pathname = usePathname();
  const { mode, user, loading, signInWithGoogle, signOut } = useAuth();

  const isHome = pathname === "/";

  if (!isHome || loading) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-[min(100vw-2rem,320px)] flex-col items-end gap-2"
      aria-label="계정 메뉴"
    >
      <div className="pointer-events-auto rounded-2xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
        {user ? (
          <div className="space-y-2">
            <Text variant="caption" className="text-muted">
              프로필
            </Text>
            <Text variant="caption" className="line-clamp-1 block max-w-[260px] font-medium text-foreground">
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
          <div className="space-y-2">
            <Text variant="caption" className="text-muted">
              로그인
            </Text>
            <Button
              type="button"
              size="sm"
              onClick={() => void signInWithGoogle()}
              className="h-8 w-full text-xs"
            >
              Google 로그인
            </Button>
          </div>
        ) : (
          <Text variant="caption" className="block text-muted">
            Supabase 미연결 — LocalStorage 모드
          </Text>
        )}
      </div>
    </div>
  );
}
