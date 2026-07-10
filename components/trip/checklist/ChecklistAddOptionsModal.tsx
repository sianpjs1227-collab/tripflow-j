"use client";

import { Button, OverlayLayer, Text } from "@/components/ui";

interface ChecklistAddOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDefaults: () => void;
  onSelectManual: () => void;
}

/** 항목 추가 방식 선택 — 간결 버전 */
export default function ChecklistAddOptionsModal({
  isOpen,
  onClose,
  onSelectDefaults,
  onSelectManual,
}: ChecklistAddOptionsModalProps) {
  return (
    <OverlayLayer
      isOpen={isOpen}
      sheet
      onClose={onClose}
      closeLabel="모달 닫기"
    >
      <Text variant="title-sm" as="h2" className="text-lg font-bold">
        ＋ 추가
      </Text>

      <div className="mt-3 space-y-2">
        <Button
          type="button"
          variant="secondary"
          className="h-10 w-full justify-start px-3 text-left text-[13px]"
          onClick={() => {
            onClose();
            onSelectDefaults();
          }}
        >
          📋 기본 항목
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="h-10 w-full justify-start px-3 text-left text-[13px]"
          onClick={() => {
            onClose();
            onSelectManual();
          }}
        >
          ✏ 직접 입력
        </Button>
      </div>
    </OverlayLayer>
  );
}
