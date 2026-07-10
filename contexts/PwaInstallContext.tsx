"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  isBeforeInstallPromptEvent,
  type BeforeInstallPromptEvent,
  type PwaInstallPromptOutcome,
} from "@/lib/pwa-install-prompt";
import {
  detectPwaPlatform,
  isPwaStandalone,
  type PwaPlatform,
} from "@/lib/pwa-runtime";

export interface PwaInstallContextValue {
  /** Android Chrome 등에서 beforeinstallprompt 가 발생했는지 */
  canInstall: boolean;
  /** 이미 PWA 로 설치·실행 중인지 */
  isInstalled: boolean;
  /** Standalone 모드 여부 */
  isStandalone: boolean;
  /** deferred prompt 보유 여부 */
  hasDeferredPrompt: boolean;
  platform: PwaPlatform;
  /**
   * 추후 Install Prompt UI 에서 호출.
   * Android: 네이티브 설치 배너 표시
   * iOS/기타: unavailable 반환 (Safari 는 수동 "홈 화면에 추가" 안내 필요)
   */
  promptInstall: () => Promise<PwaInstallPromptOutcome>;
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [hasDeferredPrompt, setHasDeferredPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<PwaPlatform>("unknown");

  const refreshInstallState = useCallback(() => {
    const standalone = isPwaStandalone();
    setIsStandalone(standalone);
    setIsInstalled(standalone);
    setPlatform(detectPwaPlatform());
  }, []);

  useEffect(() => {
    refreshInstallState();

    const standaloneMq = window.matchMedia("(display-mode: standalone)");

    const onStandaloneChange = () => refreshInstallState();
    standaloneMq.addEventListener("change", onStandaloneChange);

    const onBeforeInstallPrompt = (event: Event) => {
      if (!isBeforeInstallPromptEvent(event)) return;
      event.preventDefault();
      deferredPromptRef.current = event;
      setCanInstall(true);
      setHasDeferredPrompt(true);
    };

    const onAppInstalled = () => {
      deferredPromptRef.current = null;
      setCanInstall(false);
      setHasDeferredPrompt(false);
      refreshInstallState();
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      standaloneMq.removeEventListener("change", onStandaloneChange);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [refreshInstallState]);

  const promptInstall = useCallback(async (): Promise<PwaInstallPromptOutcome> => {
    const deferred = deferredPromptRef.current;
    if (!deferred) return "unavailable";

    await deferred.prompt();
    const { outcome } = await deferred.userChoice;

    deferredPromptRef.current = null;
    setCanInstall(false);
    setHasDeferredPrompt(false);

    if (outcome === "accepted") {
      refreshInstallState();
    }

    return outcome;
  }, [refreshInstallState]);

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      canInstall,
      isInstalled,
      isStandalone,
      hasDeferredPrompt,
      platform,
      promptInstall,
    }),
    [canInstall, hasDeferredPrompt, isInstalled, isStandalone, platform, promptInstall],
  );

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall(): PwaInstallContextValue {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) {
    throw new Error("usePwaInstall must be used within PwaInstallProvider");
  }
  return ctx;
}
