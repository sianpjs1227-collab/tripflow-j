"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthMode, AuthUser } from "@/types/auth";
import {
  getSupabaseClient,
  isSupabaseConfigured,
  mapSupabaseUser,
} from "@/lib/supabase";

interface AuthContextValue {
  mode: AuthMode;
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AuthMode>("local");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    async function initAuth() {
      if (!isSupabaseConfigured()) {
        if (mounted) {
          setMode("local");
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        if (mounted) {
          setMode("local");
          setUser(null);
          setLoading(false);
        }
        return;
      }

      setMode("supabase");

      const { data } = await client.auth.getSession();
      if (!mounted) return;

      setUser(data.session?.user ? mapSupabaseUser(data.session.user) : null);

      const { data: listener } = client.auth.onAuthStateChange(
        (_event, session) => {
          if (!mounted) return;
          setUser(session?.user ? mapSupabaseUser(session.user) : null);
        },
      );

      unsubscribe = () => listener.subscription.unsubscribe();
      setLoading(false);
    }

    void initAuth();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setMode("local");
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      console.error("[TripFlow Auth] Google 로그인 실패:", error.message);
      setMode("local");
    }
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client || mode !== "supabase") {
      setUser(null);
      return;
    }

    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) {
      console.error("[TripFlow Auth] 로그아웃 실패:", error.message);
      return;
    }

    setUser(null);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      user,
      loading,
      signInWithGoogle,
      signOut,
    }),
    [mode, user, loading, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
