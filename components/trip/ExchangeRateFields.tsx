"use client";

import type { ExchangeRateMode } from "@/types/trip";
import {
  formatExchangeRateDateLabel,
  formatExchangeRateLabel,
  getCurrencyUnitLabel,
  getExchangeRateDisplayUnit,
  parseExchangeRateInput,
  ratePerOneToDisplayAmount,
} from "@/lib/currency-utils";
import { Button, Text } from "@/components/ui";

const MODE_OPTIONS: Array<{ value: ExchangeRateMode; label: string }> = [
  { value: "startDate", label: "여행 시작일 환율" },
  { value: "current", label: "현재 환율" },
  { value: "manual", label: "직접 입력" },
];

export type ExchangeRateFieldsProps = {
  currency: string;
  mode: ExchangeRateMode;
  /** 저장용 1단위당 KRW 문자열 */
  ratePerOne: string;
  rateDate: string | null;
  unit: number;
  startDate: string;
  rateLoading: boolean;
  /** 미지원 통화 안내 (오류 아님) */
  unsupportedPrompt: boolean;
  softMessage?: string;
  onModeChange: (mode: ExchangeRateMode) => void;
  /** 표시 단위 기준 금액 문자열 (직접 입력) */
  manualDisplayValue: string;
  onManualDisplayChange: (value: string) => void;
  onRefreshCurrent: () => void;
  onAcceptManualPrompt: () => void;
  onDismissManualPrompt: () => void;
};

/**
 * 여행 생성/수정·환율 변경 공통 — 환율 기준 선택 UI
 */
export default function ExchangeRateFields({
  currency,
  mode,
  ratePerOne,
  rateDate,
  unit,
  startDate,
  rateLoading,
  unsupportedPrompt,
  softMessage,
  onModeChange,
  manualDisplayValue,
  onManualDisplayChange,
  onRefreshCurrent,
  onAcceptManualPrompt,
  onDismissManualPrompt,
}: ExchangeRateFieldsProps) {
  const displayUnit = unit > 0 ? unit : getExchangeRateDisplayUnit(currency);
  const unitLabel = getCurrencyUnitLabel(currency);
  const parsed = parseExchangeRateInput(ratePerOne);
  const previewLabel =
    parsed != null
      ? formatExchangeRateLabel(currency, parsed, displayUnit)
      : null;
  const dateLabel = formatExchangeRateDateLabel(rateDate);

  return (
    <div className="space-y-3">
      <div>
        <Text variant="muted">기본 통화</Text>
        <Text variant="body-medium" className="mt-1 font-medium">
          {currency}
        </Text>
      </div>

      <div>
        <Text variant="label" as="span" className="mb-2 block">
          환율 기준
        </Text>
        <div
          className="flex flex-col gap-1.5"
          role="radiogroup"
          aria-label="환율 기준"
        >
          {MODE_OPTIONS.map((opt) => {
            const selected = mode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onModeChange(opt.value)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                  selected
                    ? "border-primary bg-primary/10 font-medium text-foreground"
                    : "border-border bg-card text-muted hover:border-primary/40"
                }`}
              >
                {opt.label}
                {opt.value === "startDate" && (
                  <span className="mt-0.5 block text-[11px] font-normal text-muted">
                    {startDate
                      ? `${startDate} 기준`
                      : "시작일 선택 후 조회됩니다"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {unsupportedPrompt && (
        <div className="rounded-xl border border-border bg-card px-3 py-2.5">
          <Text variant="body" className="text-sm">
            이 통화는 수출입은행에서 제공하지 않습니다. 직접 입력으로
            전환하시겠습니까?
          </Text>
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onAcceptManualPrompt}
              className="h-8"
            >
              직접 입력
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDismissManualPrompt}
              className="h-8"
            >
              나중에
            </Button>
          </div>
        </div>
      )}

      {mode === "manual" ? (
        <label className="block">
          <Text variant="label" as="span">
            {displayUnit}
            {currency} ({displayUnit}
            {unitLabel}) = ? 원
          </Text>
          <input
            type="text"
            inputMode="decimal"
            value={manualDisplayValue}
            onChange={(e) => onManualDisplayChange(e.target.value)}
            placeholder="예: 945.30"
            className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {previewLabel && (
            <Text variant="caption" className="mt-1.5 block">
              저장 미리보기: {previewLabel}
            </Text>
          )}
        </label>
      ) : (
        <div className="space-y-1">
          {rateLoading ? (
            <Text variant="caption">환율 조회 중…</Text>
          ) : previewLabel ? (
            <>
              <Text variant="body-medium" className="text-sm font-semibold">
                {previewLabel}
              </Text>
              {dateLabel && (
                <Text variant="caption">
                  기준 {dateLabel}
                  {mode === "startDate" ? " (여행 시작일)" : ""}
                </Text>
              )}
            </>
          ) : (
            <Text variant="caption">
              환율 미설정 — 나중에 입력하거나 변경할 수 있습니다.
            </Text>
          )}
          {mode === "current" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRefreshCurrent}
              disabled={rateLoading}
              className="h-8 px-0 text-[11px] text-primary"
            >
              환율 새로고침
            </Button>
          )}
        </div>
      )}

      {softMessage && (
        <Text variant="caption" className="text-muted">
          {softMessage}
        </Text>
      )}
    </div>
  );
}

/** ratePerOne → 수동 입력 표시값 문자열 */
export function ratePerOneToManualInput(
  ratePerOne: string,
  currency: string,
  unit?: number | null,
): string {
  const rate = parseExchangeRateInput(ratePerOne);
  if (rate == null) return "";
  const u =
    unit != null && unit > 0 ? unit : getExchangeRateDisplayUnit(currency);
  const display = ratePerOneToDisplayAmount(rate, u);
  if (Number.isInteger(display)) return String(display);
  return String(Math.round(display * 100) / 100);
}
