"use client";

import { useCallback, useEffect } from "react";
import type { ListMemoItem } from "@/types/note";
import { Button, Card, OverlayLayer, Text } from "@/components/ui";

interface ListMemoItemDetailDialogProps {
  item: ListMemoItem | null;
  isOpen: boolean;
  onClose: () => void;
}

/** 리스트/일반 메모 공통 이미지·항목 상세 보기 Dialog */
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

  const hasImage = Boolean(item.imageUrl?.trim());
  const hasMemo = Boolean(item.memo?.trim());
  const showTitle = item.name.trim().length > 0;

  return (
    <OverlayLayer
      isOpen={isOpen}
      centered
      onClose={handleClose}
      closeLabel="상세 닫기"
      overlayClassName="bg-black/80"
      panelClassName="w-[92vw] max-w-[640px]"
    >
      <Card
        padding="lg"
        className="max-h-[90vh] w-full overflow-y-auto bg-card shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="list-memo-item-detail-title"
      >
        {showTitle ? (
          <Text
            variant="title-sm"
            as="h2"
            id="list-memo-item-detail-title"
            className="text-xl font-bold"
          >
            {item.checked ? "☑ " : ""}
            {item.name}
          </Text>
        ) : (
          <span id="list-memo-item-detail-title" className="sr-only">
            이미지 보기
          </span>
        )}

        {hasImage ? (
          <div
            className={
              showTitle
                ? "mt-4 overflow-hidden rounded-xl"
                : "overflow-hidden rounded-xl"
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.name || "첨부 이미지"}
              className="mx-auto h-auto max-h-[75vh] w-full object-contain"
            />
          </div>
        ) : null}

        {hasMemo ? (
          <Text
            variant="body"
            className="mt-4 whitespace-pre-wrap text-[14px] leading-relaxed"
          >
            {item.memo}
          </Text>
        ) : !hasImage ? (
          <Text variant="muted" className="mt-4 text-[13px]">
            메모가 없습니다.
          </Text>
        ) : null}

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
