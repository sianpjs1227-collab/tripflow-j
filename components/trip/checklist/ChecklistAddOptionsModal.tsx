"use client";

import { Button, OverlayLayer, Text } from "@/components/ui";

interface ChecklistAddOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDefaults: () => void;
  onSelectManual: () => void;
}

/** 항목 추가 방식 선택 */
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
      <Text variant="title-sm" as="h2" className="text-xl font-bold">
        항목 추가
      </Text>
      <Text variant="muted" className="mt-2">
        추가 방식을 선택하세요.
      </Text>

      <div className="mt-4 space-y-3">
        <Button
          type="button"
          variant="secondary"
          className="h-auto w-full justify-start px-4 py-3 text-left"
          onClick={() => {
            onClose();
            onSelectDefaults();
          }}
        >
          <span className="block text-base font-medium">📋 기본 항목에서 추가</span>
          <span className="mt-0.5 block text-sm font-normal text-muted">
            여행 준비 기본 항목 중 선택
          </span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="h-auto w-full justify-start px-4 py-3 text-left"
          onClick={() => {
            onClose();
            onSelectManual();
          }}
        >
          <span className="block text-base font-medium">✏ 직접 입력</span>
          <span className="mt-0.5 block text-sm font-normal text-muted">
            원하는 항목을 직접 작성
          </span>
        </Button>
      </div>
    </OverlayLayer>
  );
}
