"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { shouldShowPwaInstallButton } from "@/lib/pwa-runtime";
import PwaInstallIosSheet from "./PwaInstallIosSheet";

/** 메인 화면 우측 상단 — PWA 설치 버튼 */
export default function PwaInstallButton() {
  const { isInstalled, platform, hasDeferredPrompt, promptInstall } =
    usePwaInstall();
  const [iosSheetOpen, setIosSheetOpen] = useState(false);

  if (!shouldShowPwaInstallButton({ isInstalled, platform, hasDeferredPrompt })) {
    return null;
  }

  const handleClick = () => {
    if (platform === "ios") {
      setIosSheetOpen(true);
      return;
    }

    if (hasDeferredPrompt) {
      void promptInstall();
    }
  };

  return (
    <>
      <div className="pointer-events-none fixed right-4 top-4 z-50 sm:right-5">
        <button
          type="button"
          onClick={handleClick}
          className="pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 text-xs font-medium text-foreground shadow-lg backdrop-blur-sm transition-colors hover:bg-card active:bg-card/80"
          aria-label="앱 설치"
        >
          <Download className="h-3.5 w-3.5 text-primary" aria-hidden />
          앱 설치
        </button>
      </div>

      <PwaInstallIosSheet
        isOpen={iosSheetOpen}
        onClose={() => setIosSheetOpen(false)}
      />
    </>
  );
}
