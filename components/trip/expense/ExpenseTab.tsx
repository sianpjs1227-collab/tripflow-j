"use client";

import { useEffect, useMemo, useState } from "react";
import type { ExchangeRateMode, Trip } from "@/types/trip";
import {
  displayAmountToRatePerOne,
  formatExchangeRateDateLabel,
  formatExchangeRateLabel,
  formatExchangeRateModeLabel,
  getExchangeRateDisplayUnit,
  parseExchangeRateInput,
  tripHasExchangeRate,
} from "@/lib/currency-utils";
import { fetchExchangeRateToKrw } from "@/lib/exchange-rate-api";
import { useTripDetail } from "@/contexts/TripDetailContext";
import { useTrips } from "@/contexts/TripContext";
import type { ExpenseInput } from "@/types/expense";
import {
  createExpenseFromInput,
  getExpenseCategoryTotals,
  expenseCategoryLabels,
  formatExpenseDate,
  formatExpenseDisplay,
  formatExpenseTotalDisplay,
} from "@/lib/expense-utils";
import { displayDateToIso } from "@/lib/trip-utils";
import { Button, Card, OverlayLayer, Text } from "@/components/ui";
import TripTabHeader from "../TripTabHeader";
import ExpenseModal from "./ExpenseModal";
import ExchangeRateFields, {
  ratePerOneToManualInput,
} from "../ExchangeRateFields";

interface ExpenseTabProps {
  trip: Trip;
}

type RatePatch = {
  exchangeRate: number | null;
  exchangeRateMode: ExchangeRateMode | null;
  exchangeRateDate: string | null;
  exchangeRateUnit: number | null;
  exchangeRateProvider: Trip["exchangeRateProvider"];
};

function ExpenseTabContent({ trip }: ExpenseTabProps) {
  const { data, updateData } = useTripDetail();
  const { getTripById, patchTripExchangeRate } = useTrips();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRateEditorOpen, setIsRateEditorOpen] = useState(false);

  const currentTrip = getTripById(trip.id) ?? trip;
  const expenses = data.expenses;
  const hasRate = tripHasExchangeRate(currentTrip);
  const isForeign = currentTrip.currency !== "KRW";

  const sortedExpenses = [...expenses].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const totalDisplay = useMemo(
    () => formatExpenseTotalDisplay(expenses, currentTrip),
    [expenses, currentTrip],
  );
  const categoryTotals = useMemo(
    () => getExpenseCategoryTotals(expenses, currentTrip),
    [expenses, currentTrip],
  );

  const unit =
    currentTrip.exchangeRateUnit ??
    getExchangeRateDisplayUnit(currentTrip.currency);
  const rateLabel =
    hasRate && currentTrip.exchangeRate != null
      ? formatExchangeRateLabel(
          currentTrip.currency,
          currentTrip.exchangeRate,
          unit,
        )
      : null;
  const rateDateLabel = formatExchangeRateDateLabel(
    currentTrip.exchangeRateDate ?? currentTrip.exchangeRateUpdatedAt,
  );
  const modeLabel = formatExchangeRateModeLabel(currentTrip.exchangeRateMode);

  const handleSave = (input: ExpenseInput) => {
    const newItem = createExpenseFromInput(input, currentTrip);
    updateData((prev) => ({
      ...prev,
      expenses: [newItem, ...prev.expenses],
    }));
  };

  return (
    <div className="space-y-2">
      <TripTabHeader
        title="지출"
        meta={totalDisplay.primary}
        onAdd={() => setIsModalOpen(true)}
      />

      {totalDisplay.secondary && (
        <Text variant="caption" className="text-primary">
          {totalDisplay.secondary}
        </Text>
      )}

      {isForeign && (
        <Card padding="none" className="px-2.5 py-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Text variant="caption" className="text-[11px]">
                적용 환율
              </Text>
              {rateLabel ? (
                <>
                  <Text
                    variant="body-medium"
                    className="mt-0.5 text-[13px] font-semibold"
                  >
                    {rateLabel}
                  </Text>
                  {rateDateLabel && (
                    <Text variant="caption" className="mt-0.5 block text-[11px]">
                      기준 {rateDateLabel}
                      {modeLabel ? ` (${modeLabel})` : ""}
                    </Text>
                  )}
                  {!rateDateLabel && modeLabel && (
                    <Text variant="caption" className="mt-0.5 block text-[11px]">
                      {modeLabel}
                    </Text>
                  )}
                </>
              ) : (
                <Text variant="caption" className="mt-0.5 block">
                  환율 없음 — 원화 환산이 숨겨집니다.
                </Text>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsRateEditorOpen(true)}
              className="h-8 shrink-0 px-2 text-[11px] text-primary"
            >
              환율 변경
            </Button>
          </div>
        </Card>
      )}

      {categoryTotals.length > 0 && (
        <Card padding="none" className="space-y-1.5 px-2.5 py-2">
          <Text variant="caption" className="font-medium">
            카테고리별 합계
          </Text>
          <div className="space-y-1">
            {categoryTotals.map((item) => (
              <div
                key={item.category}
                className="flex items-start justify-between gap-3"
              >
                <Text variant="caption" className="text-[11px]">
                  {expenseCategoryLabels[item.category]}
                </Text>
                <div className="text-right">
                  <Text variant="body-medium" className="text-[12px]">
                    {item.primary}
                  </Text>
                  {item.secondary && (
                    <Text variant="caption" className="text-[10px] text-primary">
                      {item.secondary}
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {expenses.length === 0 ? (
        <Text variant="muted" className="py-4 text-center text-[12px]">
          아직 등록된 지출이 없습니다.
        </Text>
      ) : (
        <ul className="space-y-1.5" role="list">
          {sortedExpenses.map((item) => {
            const display = formatExpenseDisplay(item, currentTrip);
            return (
              <li key={item.id}>
                <Card padding="none" className="px-2.5 py-2">
                  <Text
                    variant="body-medium"
                    className="text-[13px] font-semibold"
                  >
                    {display.title}
                  </Text>
                  <Text variant="body-medium" className="mt-0.5 text-[13px]">
                    {display.primary}
                  </Text>
                  {display.secondary && (
                    <Text variant="caption" className="mt-0.5 text-primary">
                      {display.secondary}
                    </Text>
                  )}
                  <Text variant="caption" className="mt-1 text-[11px]">
                    {formatExpenseDate(item.date)} ·{" "}
                    {expenseCategoryLabels[item.category]}
                  </Text>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ExpenseModal
        trip={currentTrip}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      <ExchangeRateEditSheet
        trip={currentTrip}
        isOpen={isRateEditorOpen}
        onClose={() => setIsRateEditorOpen(false)}
        onSave={(patch) => {
          patchTripExchangeRate(currentTrip.id, patch);
          setIsRateEditorOpen(false);
        }}
      />
    </div>
  );
}

function ExchangeRateEditSheet({
  trip,
  isOpen,
  onClose,
  onSave,
}: {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onSave: (patch: RatePatch) => void;
}) {
  const startDateIso = displayDateToIso(trip.startDate);

  const [mode, setMode] = useState<ExchangeRateMode>(
    trip.exchangeRateMode ?? "startDate",
  );
  const [ratePerOne, setRatePerOne] = useState(
    trip.exchangeRate != null ? String(trip.exchangeRate) : "",
  );
  const [rateDate, setRateDate] = useState(trip.exchangeRateDate ?? null);
  const [unit, setUnit] = useState(
    trip.exchangeRateUnit ?? getExchangeRateDisplayUnit(trip.currency),
  );
  const [provider, setProvider] = useState(trip.exchangeRateProvider ?? null);
  const [manualDisplay, setManualDisplay] = useState("");
  const [rateLoading, setRateLoading] = useState(false);
  const [unsupportedPrompt, setUnsupportedPrompt] = useState(false);
  const [softMessage, setSoftMessage] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const nextMode = trip.exchangeRateMode ?? "startDate";
    const nextUnit =
      trip.exchangeRateUnit ?? getExchangeRateDisplayUnit(trip.currency);
    const nextRate =
      trip.exchangeRate != null ? String(trip.exchangeRate) : "";
    setMode(nextMode);
    setRatePerOne(nextRate);
    setRateDate(trip.exchangeRateDate ?? null);
    setUnit(nextUnit);
    setProvider(trip.exchangeRateProvider ?? null);
    setManualDisplay(
      ratePerOneToManualInput(nextRate, trip.currency, nextUnit),
    );
    setUnsupportedPrompt(false);
    setSoftMessage("");
    setRateLoading(false);
  }, [isOpen, trip]);

  useEffect(() => {
    if (!isOpen || mode === "manual") return;
    if (mode === "startDate" && !startDateIso) return;

    let cancelled = false;
    async function load() {
      setRateLoading(true);
      setSoftMessage("");
      setUnsupportedPrompt(false);
      try {
        const result = await fetchExchangeRateToKrw(trip.currency, {
          date: mode === "startDate" ? startDateIso : null,
        });
        if (cancelled) return;
        if (result.status === "unsupported") {
          setUnsupportedPrompt(true);
          return;
        }
        if (result.status === "error") {
          setSoftMessage("환율을 가져올 수 없습니다.");
          return;
        }
        setRatePerOne(String(result.quote.rate));
        setRateDate(result.quote.date);
        setUnit(result.quote.unit);
        setProvider("koreaexim");
        setManualDisplay(
          ratePerOneToManualInput(
            String(result.quote.rate),
            trip.currency,
            result.quote.unit,
          ),
        );
      } finally {
        if (!cancelled) setRateLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, startDateIso, trip.currency]);

  const applyManual = (value: string) => {
    setManualDisplay(value);
    const amount = parseExchangeRateInput(value);
    if (amount == null) {
      setRatePerOne("");
      setProvider("manual");
      return;
    }
    setRatePerOne(String(displayAmountToRatePerOne(amount, unit)));
    setRateDate(new Date().toISOString().slice(0, 10));
    setProvider("manual");
  };

  const handleModeChange = (next: ExchangeRateMode) => {
    setUnsupportedPrompt(false);
    setSoftMessage("");
    setMode(next);
    if (next !== "manual") {
      setRatePerOne("");
      setRateDate(null);
      setProvider("koreaexim");
    } else {
      setProvider("manual");
    }
  };

  return (
    <OverlayLayer
      isOpen={isOpen}
      sheet
      onClose={onClose}
      closeLabel="환율 변경 닫기"
    >
      <Text variant="title-sm" as="h2" className="text-lg font-bold">
        환율 변경
      </Text>
      <div className="mt-4">
        <ExchangeRateFields
          currency={trip.currency}
          mode={mode}
          ratePerOne={ratePerOne}
          rateDate={rateDate}
          unit={unit}
          startDate={startDateIso}
          rateLoading={rateLoading}
          unsupportedPrompt={unsupportedPrompt}
          softMessage={softMessage}
          onModeChange={handleModeChange}
          manualDisplayValue={manualDisplay}
          onManualDisplayChange={applyManual}
          onRefreshCurrent={() => {
            setMode("current");
          }}
          onAcceptManualPrompt={() => {
            setUnsupportedPrompt(false);
            handleModeChange("manual");
          }}
          onDismissManualPrompt={() => setUnsupportedPrompt(false)}
        />
      </div>
      <div className="mt-4 flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="flex-1"
        >
          취소
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={() => {
            const parsed = parseExchangeRateInput(ratePerOne);
            onSave({
              exchangeRate: parsed,
              exchangeRateMode: mode,
              exchangeRateDate: rateDate,
              exchangeRateUnit: unit,
              exchangeRateProvider:
                mode === "manual" ? "manual" : (provider ?? "koreaexim"),
            });
          }}
        >
          적용
        </Button>
      </div>
    </OverlayLayer>
  );
}

/** 지출기록 탭 — TripDetailData.expenses 사용 */
export default function ExpenseTab({ trip }: ExpenseTabProps) {
  return <ExpenseTabContent trip={trip} />;
}
