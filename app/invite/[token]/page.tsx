"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  acceptTripInvite,
  fetchTripInvitePreview,
  getTripInviteLinkErrorMessage,
  setAuthNextPath,
  type TripInviteLinkErrorCode,
} from "@/lib/supabase-trip-invite-links";
import type { TripInvitePreview } from "@/types/trip-invite";
import { Button, Card, PageContainer, Text } from "@/components/ui";

export default function InviteTokenPage() {
  const params = useParams<{ token: string }>();
  const token = typeof params.token === "string" ? params.token : "";
  const router = useRouter();
  const { mode, user, loading: authLoading, signInWithGoogle } = useAuth();

  const [preview, setPreview] = useState<TripInvitePreview | null>(null);
  const [errorCode, setErrorCode] = useState<TripInviteLinkErrorCode | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!token || authLoading) return;

    let cancelled = false;

    async function loadPreview() {
      setLoading(true);
      setActionError("");
      try {
        const result = await fetchTripInvitePreview(token);
        if (cancelled) return;

        if (!result.ok) {
          setPreview(null);
          setErrorCode(result.code);
          return;
        }

        setPreview(result.preview);
        setErrorCode(result.preview.expired ? "expired" : null);
      } catch (error) {
        console.error("[TripFlow Invite] preview failed", error);
        if (!cancelled) {
          setPreview(null);
          setErrorCode("unknown");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [token, authLoading, user?.id]);

  const handleLogin = async () => {
    setAuthNextPath(`/invite/${token}`);
    await signInWithGoogle();
  };

  const handleJoin = async () => {
    if (!preview || preview.expired) return;

    setJoining(true);
    setActionError("");

    try {
      const result = await acceptTripInvite(token);
      if (!result.ok) {
        setActionError(getTripInviteLinkErrorMessage(result.code));
        return;
      }

      router.replace(`/trip/${result.tripId}`);
    } catch (error) {
      console.error("[TripFlow Invite] accept failed", error);
      setActionError(getTripInviteLinkErrorMessage("unknown"));
    } finally {
      setJoining(false);
    }
  };

  const isLoggedIn = mode === "supabase" && user != null;
  const canJoin =
    isLoggedIn &&
    preview != null &&
    !preview.expired &&
    errorCode !== "expired";

  return (
    <div className="min-h-full bg-background">
      <PageContainer constrained className="flex min-h-full items-center py-10">
        <Card padding="md" className="w-full space-y-4">
          <Text variant="title-sm" as="h1" className="text-xl font-bold">
            여행 초대
          </Text>

          {(authLoading || loading) && (
            <Text variant="muted">초대 정보를 불러오는 중…</Text>
          )}

          {!authLoading && !loading && errorCode && !preview && (
            <Text variant="body" className="text-danger" role="alert">
              {getTripInviteLinkErrorMessage(errorCode)}
            </Text>
          )}

          {!authLoading && !loading && preview && (
            <>
              <div className="space-y-1 rounded-xl bg-background px-3 py-3">
                <Text variant="caption">여행</Text>
                <Text variant="body-medium" className="text-lg font-semibold">
                  {preview.title || preview.city}
                </Text>
                <Text variant="muted">
                  {preview.country}
                  {preview.city ? ` · ${preview.city}` : ""}
                </Text>
              </div>

              <div className="space-y-1 rounded-xl bg-background px-3 py-3">
                <Text variant="caption">Owner</Text>
                <Text variant="body-medium">{preview.ownerName}</Text>
              </div>

              {preview.expired && (
                <Text variant="body" className="text-danger" role="alert">
                  {getTripInviteLinkErrorMessage("expired")}
                </Text>
              )}

              {!isLoggedIn && !preview.expired && (
                <>
                  <Text variant="muted">
                    참여하려면 Google 계정으로 로그인해 주세요.
                  </Text>
                  <Button type="button" className="w-full" onClick={() => void handleLogin()}>
                    Google로 로그인
                  </Button>
                </>
              )}

              {canJoin && (
                <>
                  {preview.alreadyMember ? (
                    <Text variant="muted">
                      이미 이 여행에 참여 중입니다. 여행으로 이동할 수 있습니다.
                    </Text>
                  ) : (
                    <Text variant="muted">
                      참여하면 이 여행을 함께 편집할 수 있습니다.
                    </Text>
                  )}
                  <Button
                    type="button"
                    className="w-full"
                    disabled={joining}
                    onClick={() => void handleJoin()}
                  >
                    {joining
                      ? "참여 중…"
                      : preview.alreadyMember
                        ? "여행으로 이동"
                        : "참여하기"}
                  </Button>
                </>
              )}

              {actionError && (
                <Text variant="body" className="text-danger" role="alert">
                  {actionError}
                </Text>
              )}
            </>
          )}

          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted"
            onClick={() => router.push("/")}
          >
            홈으로
          </Button>
        </Card>
      </PageContainer>
    </div>
  );
}
