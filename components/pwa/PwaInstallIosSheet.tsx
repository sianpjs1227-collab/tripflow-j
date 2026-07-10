"use client";

import { Share, Plus, Smartphone } from "lucide-react";
import { BottomSheet, Text } from "@/components/ui";

interface PwaInstallIosSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: Share,
    title: "공유 버튼 탭",
    description: "Safari 하단 가운데 공유 버튼(□↑)을 누르세요.",
  },
  {
    icon: Plus,
    title: "홈 화면에 추가",
    description: '메뉴에서 "홈 화면에 추가"를 선택하세요.',
  },
  {
    icon: Smartphone,
    title: "추가 완료",
    description: '우측 상단 "추가"를 누르면 홈 화면에 TripFlow J가 설치됩니다.',
  },
] as const;

/** iOS Safari — 홈 화면에 추가 안내 Bottom Sheet */
export default function PwaInstallIosSheet({
  isOpen,
  onClose,
}: PwaInstallIosSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      closeLabel="설치 안내 닫기"
    >
      <Text variant="title-sm" as="h2" className="text-xl font-bold">
        앱 설치
      </Text>
      <Text variant="muted" className="mt-1">
        Safari에서 홈 화면에 추가하면 앱처럼 사용할 수 있습니다.
      </Text>

      <ol className="mt-5 space-y-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title}
              className="flex gap-3 rounded-xl border border-border bg-background px-3 py-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <Text variant="body-medium" className="text-sm">
                  {index + 1}. {step.title}
                </Text>
                <Text variant="muted" className="mt-0.5 text-xs leading-relaxed">
                  {step.description}
                </Text>
              </div>
            </li>
          );
        })}
      </ol>
    </BottomSheet>
  );
}
