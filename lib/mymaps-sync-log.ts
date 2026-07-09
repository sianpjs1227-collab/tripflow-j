const LOG_PREFIX = "[TripFlow MyMaps Sync]";

/** STEP 완료 로그 */
export function logMyMapsSyncStep(
  step: number,
  message: string,
  data?: Record<string, unknown>,
): void {
  if (data) {
    console.log(LOG_PREFIX, `STEP ${step}`, message, data);
    return;
  }
  console.log(LOG_PREFIX, `STEP ${step}`, message);
}

/** STEP 실패 로그 — STEP 번호와 Error.message 필수 출력 */
export function errorMyMapsSyncStep(step: number, error: unknown): void {
  const message =
    error instanceof Error ? error.message : String(error);
  console.error(LOG_PREFIX, `STEP ${step} 실패`, message);
  console.error(error);
}

/** 동기화 단계 로그 */
export function logMyMapsSync(
  step: string,
  data?: Record<string, unknown>,
): void {
  if (data) {
    console.log(LOG_PREFIX, step, data);
    return;
  }
  console.log(LOG_PREFIX, step);
}

/** 동기화 오류 로그 */
export function errorMyMapsSync(
  message: string,
  cause?: unknown,
  context?: Record<string, unknown>,
): void {
  console.error(LOG_PREFIX, message, {
    ...context,
    cause:
      cause instanceof Error
        ? { name: cause.name, message: cause.message, stack: cause.stack }
        : cause,
  });
}

/** UI·throw용 오류 메시지 */
export function toMyMapsSyncErrorMessage(
  error: unknown,
  fallback = "알 수 없는 오류가 발생했습니다.",
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
