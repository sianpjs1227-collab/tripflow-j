"use client";

import { useCallback, useEffect, useRef } from "react";

/** Sticky 레이어 높이 CSS 변수 */
export const STICKY_LAYER_VARS = {
  header: "--sticky-header-height",
  tripTabs: "--sticky-trip-tabs-height",
  dayChips: "--sticky-day-chips-height",
  scheduleSubview: "--sticky-schedule-subview-height",
} as const;

export type StickyLayerVar =
  (typeof STICKY_LAYER_VARS)[keyof typeof STICKY_LAYER_VARS];

function setLayerHeight(cssVar: StickyLayerVar, heightPx: number) {
  document.documentElement.style.setProperty(cssVar, `${heightPx}px`);
}

/**
 * Sticky 요소 높이를 측정해 CSS 변수로 등록합니다.
 * 언마운트 시 0px으로 초기화합니다.
 */
export function useStickyLayer(cssVar: StickyLayerVar) {
  const observerRef = useRef<ResizeObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const disconnect = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
  }, []);

  const ref = useCallback(
    (element: HTMLElement | null) => {
      disconnect();
      elementRef.current = element;

      if (!element) {
        setLayerHeight(cssVar, 0);
        return;
      }

      const updateHeight = () => {
        setLayerHeight(cssVar, element.offsetHeight);
      };

      updateHeight();

      const observer = new ResizeObserver(updateHeight);
      observer.observe(element);
      observerRef.current = observer;
    },
    [cssVar, disconnect],
  );

  useEffect(() => {
    const handleResize = () => {
      if (elementRef.current) {
        setLayerHeight(cssVar, elementRef.current.offsetHeight);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      disconnect();
      setLayerHeight(cssVar, 0);
    };
  }, [cssVar, disconnect]);

  return ref;
}
