"use client";

import { Button, Card, OverlayLayer, Text } from "@/components/ui";
import type { NoteType } from "@/types/note";

interface MemoTypePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: NoteType) => void;
}

/** 메모 타입 선택 — 중앙 Dialog */
export default function MemoTypePickerModal({
  isOpen,
  onClose,
  onSelect,
}: MemoTypePickerModalProps) {
  return (
    <OverlayLayer
      isOpen={isOpen}
      centered
      onClose={onClose}
      closeLabel="모달 닫기"
      panelClassName="w-[90vw] max-w-[460px]"
    >
      <Card
        padding="lg"
        className="w-full bg-card shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="memo-type-picker-title"
      >
        <Text
          variant="title-sm"
          as="h2"
          id="memo-type-picker-title"
          className="text-lg font-bold"
        >
          메모 추가
        </Text>

        <div className="mt-3 space-y-2">
          <Button
            type="button"
            variant="secondary"
            className="h-10 w-full justify-start px-3 text-left text-[13px]"
            onClick={() => {
              onClose();
              onSelect("text");
            }}
          >
            일반 메모
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="h-10 w-full justify-start px-3 text-left text-[13px]"
            onClick={() => {
              onClose();
              onSelect("list");
            }}
          >
            리스트 메모
          </Button>
        </div>
      </Card>
    </OverlayLayer>
  );
}
