"use client";

import { useCallback, useEffect } from "react";
import type { ListMemoItem } from "@/types/note";
import { Button, Card, OverlayLayer, Text } from "@/components/ui";

interface ListMemoItemDetailDialogProps {
  item: ListMemoItem | null;
  isOpen: boolean;
  onClose: () => void;
}

/** 리스트 메모 항목 상세 보기 — 중앙 Dialog */
export default function ListMemoItemDetailDialog({
  item,
  isOpen,
  onClose,
}: ListMemoItemDetailDialogProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  if (!item) return null;

  return (
    <OverlayLayer
      isOpen={isOpen}
      centered
      onClose={handleClose}
      closeLabel="상세 닫기"
      panelClassName="w-[90vw] max-w-[460px]"
    >
      <Card
        padding="lg"
        className="max-h-[85vh] w-full overflow-y-auto bg-card shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="list-memo-item-detail-title"
      >
        <Text
          variant="title-sm"
          as="h2"
          id="list-memo-item-detail-title"
          className="text-xl font-bold"
        >
          {item.name}
        </Text>

        {item.imageUrl ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-auto w-full object-contain"
            />
          </div>
        ) : null}

        {item.memo?.trim() ? (
          <Text
            variant="body"
            className="mt-4 whitespace-pre-wrap text-[14px] leading-relaxed"
          >
            {item.memo}
          </Text>
        ) : (
          <Text variant="muted" className="mt-4 text-[13px]">
            메모가 없습니다.
          </Text>
        )}

        <div className="mt-5">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="w-full"
          >
            닫기
          </Button>
        </div>
      </Card>
    </OverlayLayer>
  );
}
