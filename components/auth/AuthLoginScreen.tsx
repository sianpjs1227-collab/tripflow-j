"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button, PageContainer, Text } from "@/components/ui";

/** Supabase 연결 시 세션이 없을 때 표시되는 로그인 화면 */
export default function AuthLoginScreen() {
  const { signInWithGoogle } = useAuth();

  return (
    <PageContainer className="flex min-h-full flex-col items-center justify-center py-16">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <Text
            variant="caption"
            className="text-xs font-semibold uppercase tracking-wider text-primary"
          >
            TripFlow J
          </Text>
          <Text variant="title" as="h1" className="text-2xl font-bold">
            여행 계획을 시작하세요
          </Text>
          <Text variant="muted" className="text-sm leading-relaxed">
            Google 계정으로 로그인하면 여행 데이터가 클라우드에 안전하게
            저장되고, 기기를 바꿔도 이어서 사용할 수 있습니다.
          </Text>
        </div>

        <Button
          type="button"
          size="lg"
          className="h-12 w-full text-sm font-semibold"
          onClick={() => void signInWithGoogle()}
        >
          Google로 로그인
        </Button>

        <Text variant="caption" className="text-xs text-muted">
          로그인 상태는 이 기기에 유지됩니다. 로그아웃할 때까지 자동으로
          로그인됩니다.
        </Text>
      </div>
    </PageContainer>
  );
}
