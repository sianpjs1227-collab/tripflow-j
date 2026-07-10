"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { isAuthPublicPath } from "@/lib/auth-routes";
import AuthLoginScreen from "./AuthLoginScreen";
import AuthSessionLoading from "./AuthSessionLoading";

/**
 * 앱 시작 시 세션을 확인하고,
 * 세션이 없으면 로그인 화면을, 있으면 자식 콘텐츠를 표시한다.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { mode, user, loading } = useAuth();

  if (loading) {
    return <AuthSessionLoading />;
  }

  if (mode === "supabase" && !user && !isAuthPublicPath(pathname)) {
    return <AuthLoginScreen />;
  }

  return <>{children}</>;
}
