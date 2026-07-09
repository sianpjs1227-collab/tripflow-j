"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

const SHEET_EXIT_MS = 300;

/** TripFlow J — z-index 레이어 기준 (globals.css @theme 과 동기화) */
export const Z_INDEX = {
  stickyDay: 10,
  stickySubview: 12,
  stickyTab: 15,
  stickyHeader: 20,
  overlay: 90,
  dialog: 100,
} as const;

/** document.body 포털 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}

export function SheetDragHandle() {
  return (
    <div className="flex shrink-0 justify-center pt-3 pb-2" aria-hidden>
      <div className="h-1 w-10 rounded-full bg-border" />
    </div>
  );
}

interface OverlayLayerProps {
  children: React.ReactNode;
  /** false 시 닫힘 애니메이션 후 언마운트 */
  isOpen?: boolean;
  onClose?: () => void;
  closeLabel?: string;
  panelClassName?: string;
  /** Bottom Sheet 스타일 (하단 정렬, 80vh, 핸들) */
  sheet?: boolean;
  /** sheet일 때 상단 Drag Handle */
  showHandle?: boolean;
  /** sheet일 때 내부 스크롤 래퍼 (false면 children이 레이아웃 직접 관리) */
  scrollBody?: boolean;
}

/**
 * Modal / BottomSheet / ActionSheet 공통 레이어
 * — Portal + Overlay(z-90) + Content(z-100)
 */
export function OverlayLayer({
  children,
  isOpen = true,
  onClose,
  closeLabel = "닫기",
  panelClassName,
  sheet = false,
  showHandle = true,
  scrollBody = true,
}: OverlayLayerProps) {
  const [rendered, setRendered] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      setClosing(false);
      return;
    }

    if (rendered) {
      setClosing(true);
      const timer = window.setTimeout(() => {
        setRendered(false);
        setClosing(false);
      }, SHEET_EXIT_MS);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, rendered]);

  useEffect(() => {
    if (!rendered) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [rendered]);

  if (!rendered) return null;

  const sheetPanelClass =
    "flex max-h-[80vh] w-full max-w-lg flex-col rounded-t-2xl bg-card shadow-xl";

  return (
    <Portal>
      {onClose && (
        <button
          type="button"
          className={cn(
            "fixed inset-0 z-overlay bg-black/40",
            closing ? "animate-fade-out" : "animate-fade-in",
          )}
          onClick={onClose}
          aria-label={closeLabel}
        />
      )}

      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-dialog flex justify-center",
          sheet ? "items-end" : "items-end sm:items-center",
        )}
        role="presentation"
      >
        <div
          className={cn(
            "pointer-events-auto relative w-full max-w-lg",
            sheet
              ? cn(
                  sheetPanelClass,
                  closing ? "animate-sheet-down" : "animate-sheet-up",
                )
              : cn(
                  "rounded-t-2xl bg-card shadow-xl sm:rounded-2xl",
                  closing ? "animate-sheet-down" : "animate-sheet-up",
                ),
            panelClassName,
          )}
        >
          {sheet && showHandle && <SheetDragHandle />}

          {sheet && scrollBody ? (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 sm:px-5">
              {children}
            </div>
          ) : sheet ? (
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          ) : (
            children
          )}
        </div>
      </div>
    </Portal>
  );
}

/** 폼 입력용 Bottom Sheet — sheet 기본값 적용 */
export function BottomSheet(
  props: Omit<OverlayLayerProps, "sheet">,
) {
  return <OverlayLayer {...props} sheet />;
}
