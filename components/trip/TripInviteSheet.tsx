"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button, OverlayLayer, Text } from "@/components/ui";
import {
  buildTripInviteUrl,
  createTripInviteLink,
  getTripInviteLinkErrorMessage,
} from "@/lib/supabase-trip-invite-links";

interface TripInviteSheetProps {
  tripId: string;
  tripLabel: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TripInviteSheet({
  tripId,
  tripLabel,
  isOpen,
  onClose,
}: TripInviteSheetProps) {
  const { user } = useAuth();
  const [inviteUrl, setInviteUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function createLink() {
      if (!user) {
        setError(getTripInviteLinkErrorMessage("not_authenticated"));
        return;
      }

      setLoading(true);
      setError("");
      setCopied(false);
      setInviteUrl("");
      setExpiresAt("");

      try {
        const invite = await createTripInviteLink(tripId, user.id);
        if (cancelled) return;
        setInviteUrl(buildTripInviteUrl(invite.token));
        setExpiresAt(invite.expiresAt);
      } catch (createError) {
        console.error("[TripFlow Invite Link]", createError);
        if (!cancelled) {
          setError(getTripInviteLinkErrorMessage("unknown"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void createLink();

    return () => {
      cancelled = true;
    };
  }, [isOpen, tripId, user]);

  const handleClose = () => {
    setInviteUrl("");
    setExpiresAt("");
    setError("");
    setCopied(false);
    setLoading(false);
    onClose();
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setError("");
    } catch {
      setError("링크 복사에 실패했습니다. 직접 선택해서 복사해주세요.");
    }
  };

  const expiresLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <OverlayLayer
      isOpen={isOpen}
      sheet
      onClose={handleClose}
      closeLabel="공유 닫기"
    >
      <Text variant="title-sm" as="h2" className="text-xl font-bold">
        여행 공유
      </Text>
      <Text variant="muted" className="mt-1">
        {tripLabel} 초대 링크를 복사해 친구에게 보내세요. 기본 유효기간은 30일입니다.
      </Text>

      <div className="mt-4 space-y-4">
        <div className="rounded-xl border border-border bg-background px-3 py-3">
          <div className="flex items-start gap-2">
            <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
            <Text
              variant="body"
              className="break-all text-sm leading-relaxed"
            >
              {loading ? "초대 링크 생성 중…" : inviteUrl || "링크를 만들 수 없습니다."}
            </Text>
          </div>
        </div>

        {expiresLabel && (
          <Text variant="caption">만료일: {expiresLabel}</Text>
        )}

        {error && (
          <Text variant="body" className="text-danger" role="alert">
            {error}
          </Text>
        )}

        <div className="flex gap-3 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            닫기
          </Button>
          <Button
            type="button"
            onClick={() => void handleCopy()}
            className="flex-1"
            disabled={!inviteUrl || loading}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" aria-hidden />
                복사됨
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden />
                링크 복사
              </>
            )}
          </Button>
        </div>
      </div>
    </OverlayLayer>
  );
}
