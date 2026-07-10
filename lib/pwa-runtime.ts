export type PwaPlatform = "ios" | "android" | "desktop" | "unknown";

/** Standalone(PWA) 또는 iOS 홈 화면 추가 실행 여부 */
export function isPwaStandalone(): boolean {
  if (typeof window === "undefined") return false;

  const standaloneMq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true;

  return standaloneMq || iosStandalone;
}

export function detectPwaPlatform(): PwaPlatform {
  if (typeof window === "undefined") return "unknown";

  const ua = window.navigator.userAgent;

  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (window.matchMedia("(pointer: fine)").matches) return "desktop";
  return "unknown";
}

/** Android Chrome beforeinstallprompt 지원 여부 (런타임) */
export function supportsBeforeInstallPrompt(): boolean {
  return typeof window !== "undefined" && "BeforeInstallPromptEvent" in window;
}
