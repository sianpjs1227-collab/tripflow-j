"use client";

import { useEffect } from "react";

/** 프로덕션에서 PWA service worker 등록 */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("[TripFlow PWA] service worker 등록 실패:", error);
    });
  }, []);

  return null;
}
