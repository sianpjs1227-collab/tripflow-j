"use client";

import { Text } from "@/components/ui";

/** 앱 시작 시 Supabase 세션 복원 대기 화면 */
export default function AuthSessionLoading() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-background px-6 py-16">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        aria-hidden
      />
      <Text variant="muted">세션 확인 중...</Text>
    </div>
  );
}
