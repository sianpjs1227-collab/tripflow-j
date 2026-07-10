"use client";

import { useEffect, useState } from "react";
import { Button, Input, OverlayLayer, Text } from "@/components/ui";
import {
  getTripInviteErrorMessage,
  inviteTripMemberByEmail,
} from "@/lib/supabase-trip-invite";

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
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setEmail("");
    setError("");
    setSuccess("");
    setSubmitting(false);
  }, [isOpen]);

  const handleClose = () => {
    setEmail("");
    setError("");
    setSuccess("");
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmed = email.trim();
    if (!trimmed) {
      setError("초대할 Google 이메일을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await inviteTripMemberByEmail(tripId, trimmed);
      if (!result.ok) {
        setError(getTripInviteErrorMessage(result.code));
        return;
      }

      setSuccess(`${trimmed} 님을 여행에 초대했습니다.`);
      setEmail("");
    } catch (inviteError) {
      console.error("[TripFlow Invite]", inviteError);
      setError(getTripInviteErrorMessage("unknown"));
    } finally {
      setSubmitting(false);
    }
  };

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
        {tripLabel}에 Google 계정 이메일을 초대해 함께 편집할 수 있습니다.
      </Text>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <label className="block">
          <Text variant="label" as="span">
            Google 이메일
          </Text>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
              setSuccess("");
            }}
            placeholder="friend@gmail.com"
            className="mt-1"
            disabled={submitting}
          />
        </label>

        {error && (
          <Text variant="body" className="text-danger" role="alert">
            {error}
          </Text>
        )}
        {success && (
          <Text variant="body" className="text-primary" role="status">
            {success}
          </Text>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
            disabled={submitting}
          >
            닫기
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? "초대 중…" : "초대"}
          </Button>
        </div>
      </form>
    </OverlayLayer>
  );
}
