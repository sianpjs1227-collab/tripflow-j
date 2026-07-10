/** Android Chrome beforeinstallprompt 이벤트 타입 */

export type PwaInstallPromptOutcome = "accepted" | "dismissed" | "unavailable";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function isBeforeInstallPromptEvent(
  event: Event,
): event is BeforeInstallPromptEvent {
  return (
    event.type === "beforeinstallprompt" &&
    "prompt" in event &&
    typeof (event as BeforeInstallPromptEvent).prompt === "function"
  );
}
