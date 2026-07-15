"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

export const SHEET_EXIT_MS = 300;
const SHEET_DISMISS_PX = 96;

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

export function SheetDragHandle({
  onPointerDown,
}: {
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className="flex shrink-0 touch-none justify-center pt-3 pb-2"
      onPointerDown={onPointerDown}
      aria-hidden
    >
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
  /** 모바일 포함 화면 중앙 Dialog (iOS 확인창 스타일) */
  centered?: boolean;
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
  centered = false,
}: OverlayLayerProps) {
  const [rendered, setRendered] = useState(isOpen);
  const [closing, setClosing] = useState(false);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef(0);
  const dragOffsetYRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      setClosing(false);
      setDragOffsetY(0);
      dragOffsetYRef.current = 0;
      setIsDragging(false);
      return;
    }

    if (rendered) {
      setClosing(true);
      setIsDragging(false);
      setDragOffsetY(0);
      dragOffsetYRef.current = 0;
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

  const endDrag = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const offset = dragOffsetYRef.current;
    if (offset >= SHEET_DISMISS_PX && onClose) {
      onClose();
      return;
    }
    setDragOffsetY(0);
    dragOffsetYRef.current = 0;
  }, [isDragging, onClose]);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (event: PointerEvent) => {
      // 세로만 반영 — 가로(deltaX)는 무시
      const nextY = Math.max(0, event.clientY - dragStartYRef.current);
      dragOffsetYRef.current = nextY;
      setDragOffsetY(nextY);
    };

    const onUp = () => {
      endDrag();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [isDragging, endDrag]);

  const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!sheet || !onClose || closing) return;
    // 마우스 좌클릭 / 터치만
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    dragStartYRef.current = event.clientY;
    dragOffsetYRef.current = 0;
    setDragOffsetY(0);
    setIsDragging(true);
  };

  if (!rendered) return null;

  const sheetPanelClass =
    "flex max-h-[80vh] w-full max-w-lg flex-col overflow-x-hidden overscroll-x-none touch-pan-y rounded-t-2xl bg-card shadow-xl";

  const panelStyle =
    sheet && (isDragging || dragOffsetY > 0)
      ? {
          transform: `translate3d(0, ${dragOffsetY}px, 0)`,
          transition: isDragging ? "none" : "transform 200ms ease-out",
        }
      : undefined;

  const alignClass = sheet
    ? "items-end"
    : centered
      ? "items-center px-4"
      : "items-end sm:items-center";

  return (
    <Portal>
      {onClose && (
        <button
          type="button"
          className={cn(
            "fixed inset-0 z-overlay touch-none bg-black/40",
            closing ? "animate-fade-out" : "animate-fade-in",
          )}
          onClick={onClose}
          aria-label={closeLabel}
        />
      )}

      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-dialog flex justify-center overflow-x-hidden overscroll-x-none",
          alignClass,
        )}
        role="presentation"
      >
        <div
          className={cn(
            "pointer-events-auto relative w-full max-w-lg",
            sheet
              ? cn(
                  sheetPanelClass,
                  !isDragging &&
                    dragOffsetY === 0 &&
                    (closing ? "animate-sheet-down" : "animate-sheet-up"),
                )
              : centered
                ? cn(
                    "mx-auto w-full max-w-sm",
                    closing ? "animate-fade-out" : "animate-fade-in",
                  )
                : cn(
                    "overflow-x-hidden rounded-t-2xl bg-card shadow-xl sm:rounded-2xl",
                    closing ? "animate-sheet-down" : "animate-sheet-up",
                  ),
            panelClassName,
          )}
          style={panelStyle}
        >
          {sheet && showHandle && (
            <SheetDragHandle onPointerDown={handleDragStart} />
          )}

          {sheet && scrollBody ? (
            <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-contain px-4 pb-6 sm:px-5">
              {children}
            </div>
          ) : sheet ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden touch-pan-y">
              {children}
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </Portal>
  );
}

/** 폼 입력용 Bottom Sheet — sheet 기본값 적용 */
export function BottomSheet(props: Omit<OverlayLayerProps, "sheet">) {
  return <OverlayLayer {...props} sheet />;
}
