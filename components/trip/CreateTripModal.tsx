"use client";

import { useEffect, useRef, useState } from "react";
import { COUNTRIES, getCurrencyCodeByCountryCode } from "@/data/countries";
import type {
  CreateTripInput,
  ExchangeRateMode,
  Trip,
  TripStatus,
} from "@/types/trip";
import { useTrips } from "@/contexts/TripContext";
import {
  displayDateToIso,
  getCountryCodeByName,
} from "@/lib/trip-utils";
import {
  displayAmountToRatePerOne,
  getExchangeRateDisplayUnit,
  parseExchangeRateInput,
} from "@/lib/currency-utils";
import { fetchExchangeRateToKrw } from "@/lib/exchange-rate-api";
import {
  tripStatusDisplay,
  tripStatusOptions,
} from "@/lib/trip-status";
import { Button, Card, Chip, Input, OverlayLayer, Text } from "@/components/ui";
import CityAutocomplete from "./CityAutocomplete";
import TripCoverPicker from "./TripCoverPicker";
import TripDateRangePicker from "./TripDateRangePicker";
import ExchangeRateFields, {
  ratePerOneToManualInput,
} from "./ExchangeRateFields";

interface CreateTripModalProps {
  isOpen: boolean;
  editingTrip?: Trip | null;
  initialCountryCode?: string;
  onClose: () => void;
  onSave: (input: CreateTripInput) => void;
}

const EMPTY_FORM: CreateTripInput = {
  name: "",
  countryCode: "",
  city: "",
  startDate: "",
  endDate: "",
  exchangeRateMode: "startDate",
  exchangeRate: "",
  exchangeRateDate: null,
  exchangeRateUnit: null,
  exchangeRateProvider: null,
  coverImage: "",
};

const selectClassName =
  "country-flag mt-1 h-10 w-full rounded-xl border border-border bg-card px-3.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

/**
 * 새 여행 생성 / 여행 수정 모달 — 환율 기준 선택
 */
export default function CreateTripModal({
  isOpen,
  editingTrip = null,
  initialCountryCode = "",
  onClose,
  onSave,
}: CreateTripModalProps) {
  const { setTripStatus, resetTripStatusAuto } = useTrips();
  const [form, setForm] = useState<CreateTripInput>(EMPTY_FORM);
  const [includeDefaultChecklist, setIncludeDefaultChecklist] = useState(true);
  const [error, setError] = useState("");
  const [focusCityInput, setFocusCityInput] = useState(false);
  const [rateLoading, setRateLoading] = useState(false);
  const [softMessage, setSoftMessage] = useState("");
  const [unsupportedPrompt, setUnsupportedPrompt] = useState(false);
  const [manualDisplay, setManualDisplay] = useState("");
  const fetchSeq = useRef(0);
  const isEditing = editingTrip !== null;

  const currency = form.countryCode
    ? getCurrencyCodeByCountryCode(form.countryCode)
    : "";
  const isKrwTrip = currency === "KRW";
  const displayUnit =
    form.exchangeRateUnit != null && form.exchangeRateUnit > 0
      ? form.exchangeRateUnit
      : currency
        ? getExchangeRateDisplayUnit(currency)
        : 1;

  useEffect(() => {
    if (!isOpen) return;

    if (editingTrip) {
      const city = editingTrip.city || editingTrip.name;
      const hasCustomName =
        editingTrip.name.trim() !== "" && editingTrip.name !== city;
      const rateStr =
        editingTrip.exchangeRate != null && editingTrip.exchangeRate > 0
          ? String(editingTrip.exchangeRate)
          : "";
      const mode = editingTrip.exchangeRateMode ?? "startDate";
      const unit =
        editingTrip.exchangeRateUnit ??
        getExchangeRateDisplayUnit(editingTrip.currency);

      setForm({
        name: hasCustomName ? editingTrip.name : "",
        countryCode:
          editingTrip.countryCode ||
          getCountryCodeByName(editingTrip.country),
        city,
        startDate: displayDateToIso(editingTrip.startDate),
        endDate: displayDateToIso(editingTrip.endDate),
        exchangeRateMode: mode,
        exchangeRate: rateStr,
        exchangeRateDate: editingTrip.exchangeRateDate ?? null,
        exchangeRateUnit: unit,
        exchangeRateProvider: editingTrip.exchangeRateProvider ?? null,
        coverImage: editingTrip.coverImage ?? "",
      });
      setManualDisplay(
        ratePerOneToManualInput(rateStr, editingTrip.currency, unit),
      );
    } else {
      setForm({
        ...EMPTY_FORM,
        countryCode: initialCountryCode.trim(),
      });
      setManualDisplay("");
      setIncludeDefaultChecklist(true);
      setFocusCityInput(Boolean(initialCountryCode.trim()));
    }
    setError("");
    setSoftMessage("");
    setUnsupportedPrompt(false);
    setRateLoading(false);
    if (editingTrip) {
      setFocusCityInput(false);
    }
  }, [isOpen, editingTrip, initialCountryCode]);

  /** startDate / current 모드 자동 조회 */
  useEffect(() => {
    if (!isOpen || !form.countryCode || isKrwTrip) return;
    if (form.exchangeRateMode === "manual") return;
    if (form.exchangeRateMode === "startDate" && !form.startDate) return;

    // 이미 값이 있고 모드·날짜가 맞으면 스킵하지 않음 — 의존성으로 재조회
    const seq = ++fetchSeq.current;
    let cancelled = false;

    async function loadRate() {
      setRateLoading(true);
      setSoftMessage("");
      setUnsupportedPrompt(false);

      const dateArg =
        form.exchangeRateMode === "startDate" ? form.startDate : null;

      try {
        const result = await fetchExchangeRateToKrw(currency, {
          date: dateArg,
        });
        if (cancelled || seq !== fetchSeq.current) return;

        if (result.status === "unsupported") {
          setUnsupportedPrompt(true);
          return;
        }

        if (result.status === "error") {
          setSoftMessage(
            "환율을 가져올 수 없습니다. 여행은 그대로 저장할 수 있습니다.",
          );
          return;
        }

        const { quote } = result;
        setForm((prev) => ({
          ...prev,
          exchangeRate: String(quote.rate),
          exchangeRateDate: quote.date,
          exchangeRateUnit: quote.unit,
          exchangeRateProvider: "koreaexim",
        }));
        setManualDisplay(
          ratePerOneToManualInput(String(quote.rate), currency, quote.unit),
        );
      } catch {
        if (!cancelled && seq === fetchSeq.current) {
          setSoftMessage(
            "환율을 가져올 수 없습니다. 여행은 그대로 저장할 수 있습니다.",
          );
        }
      } finally {
        if (!cancelled && seq === fetchSeq.current) {
          setRateLoading(false);
        }
      }
    }

    void loadRate();

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    form.countryCode,
    form.exchangeRateMode,
    form.startDate,
    currency,
    isKrwTrip,
  ]);

  const applyManualDisplay = (value: string) => {
    setManualDisplay(value);
    const amount = parseExchangeRateInput(value);
    if (amount == null) {
      setForm((prev) => ({
        ...prev,
        exchangeRate: "",
        exchangeRateProvider: "manual",
        exchangeRateUnit: displayUnit,
      }));
      return;
    }
    const ratePerOne = displayAmountToRatePerOne(amount, displayUnit);
    setForm((prev) => ({
      ...prev,
      exchangeRate: String(ratePerOne),
      exchangeRateDate: new Date().toISOString().slice(0, 10),
      exchangeRateUnit: displayUnit,
      exchangeRateProvider: "manual",
    }));
  };

  const handleModeChange = (mode: ExchangeRateMode) => {
    setUnsupportedPrompt(false);
    setSoftMessage("");
    setForm((prev) => ({
      ...prev,
      exchangeRateMode: mode,
      exchangeRate: mode === "manual" ? prev.exchangeRate : "",
      exchangeRateDate: mode === "manual" ? prev.exchangeRateDate : null,
      exchangeRateProvider:
        mode === "manual" ? "manual" : ("koreaexim" as const),
      exchangeRateUnit: currency
        ? getExchangeRateDisplayUnit(currency)
        : prev.exchangeRateUnit,
    }));
    if (mode === "manual" && form.exchangeRate) {
      setManualDisplay(
        ratePerOneToManualInput(form.exchangeRate, currency, displayUnit),
      );
    }
  };

  const handleChange = (field: keyof CreateTripInput, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "countryCode") {
        next.city = "";
        next.exchangeRate = "";
        next.exchangeRateDate = null;
        next.exchangeRateProvider = null;
        next.exchangeRateMode = "startDate";
        const nextCur = value
          ? getCurrencyCodeByCountryCode(value)
          : "";
        next.exchangeRateUnit = nextCur
          ? getExchangeRateDisplayUnit(nextCur)
          : null;
        if (value) {
          setFocusCityInput(true);
        }
        setManualDisplay("");
        setUnsupportedPrompt(false);
      }

      return next;
    });
    setError("");
    setSoftMessage("");
  };

  const handleRefreshCurrent = async () => {
    if (!currency || isKrwTrip) return;
    setForm((prev) => ({ ...prev, exchangeRateMode: "current" }));
    setRateLoading(true);
    setSoftMessage("");
    setUnsupportedPrompt(false);
    try {
      const result = await fetchExchangeRateToKrw(currency);
      if (result.status === "unsupported") {
        setUnsupportedPrompt(true);
        return;
      }
      if (result.status === "error") {
        setSoftMessage("환율을 가져올 수 없습니다.");
        return;
      }
      const { quote } = result;
      setForm((prev) => ({
        ...prev,
        exchangeRateMode: "current",
        exchangeRate: String(quote.rate),
        exchangeRateDate: quote.date,
        exchangeRateUnit: quote.unit,
        exchangeRateProvider: "koreaexim",
      }));
      setManualDisplay(
        ratePerOneToManualInput(String(quote.rate), currency, quote.unit),
      );
    } catch {
      setSoftMessage("환율을 가져올 수 없습니다.");
    } finally {
      setRateLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.countryCode ||
      !form.city.trim() ||
      !form.startDate ||
      !form.endDate
    ) {
      setError("국가, 도시, 날짜를 입력해주세요.");
      return;
    }

    if (form.endDate < form.startDate) {
      setError("종료일은 시작일 이후여야 합니다.");
      return;
    }

    onSave({
      ...form,
      exchangeRateUnit: isKrwTrip ? null : displayUnit,
      includeDefaultChecklist: isEditing ? undefined : includeDefaultChecklist,
    });
    setForm(EMPTY_FORM);
    setManualDisplay("");
    setError("");
    onClose();
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setManualDisplay("");
    setError("");
    setSoftMessage("");
    setUnsupportedPrompt(false);
    onClose();
  };

  const handleStatusChange = (status: TripStatus) => {
    if (!editingTrip) return;
    if (status === editingTrip.status && editingTrip.statusIsManual) return;
    setTripStatus(editingTrip.id, status);
  };

  return (
    <OverlayLayer
      isOpen={isOpen}
      sheet
      onClose={handleClose}
      closeLabel="모달 닫기"
    >
      <Text variant="title-sm" as="h2" className="text-xl font-bold">
        {isEditing ? "여행 수정" : "새 여행 만들기"}
      </Text>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <TripCoverPicker
          value={form.coverImage}
          onChange={(coverImage) => handleChange("coverImage", coverImage)}
          onError={setError}
        />

        <label className="block">
          <Text variant="label" as="span">
            국가
          </Text>
          <select
            value={form.countryCode}
            onChange={(e) => handleChange("countryCode", e.target.value)}
            className={selectClassName}
          >
            <option value="">국가를 선택하세요</option>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>
        </label>

        {currency && !isKrwTrip && (
          <Card padding="sm" className="bg-primary/5">
            <ExchangeRateFields
              currency={currency}
              mode={form.exchangeRateMode}
              ratePerOne={form.exchangeRate}
              rateDate={form.exchangeRateDate ?? null}
              unit={displayUnit}
              startDate={form.startDate}
              rateLoading={rateLoading}
              unsupportedPrompt={unsupportedPrompt}
              softMessage={softMessage}
              onModeChange={handleModeChange}
              manualDisplayValue={manualDisplay}
              onManualDisplayChange={applyManualDisplay}
              onRefreshCurrent={() => void handleRefreshCurrent()}
              onAcceptManualPrompt={() => {
                setUnsupportedPrompt(false);
                handleModeChange("manual");
              }}
              onDismissManualPrompt={() => setUnsupportedPrompt(false)}
            />
          </Card>
        )}

        {currency && isKrwTrip && (
          <Card padding="sm" className="bg-primary/5">
            <Text variant="muted">기본 통화</Text>
            <Text variant="body-medium" className="mt-1 font-medium">
              KRW
            </Text>
          </Card>
        )}

        <div className="block">
          <Text variant="label" as="span">
            도시
          </Text>
          <CityAutocomplete
            countryCode={form.countryCode}
            value={form.city}
            onChange={(city) => handleChange("city", city)}
            autoFocus={focusCityInput}
            onAutoFocusComplete={() => setFocusCityInput(false)}
          />
        </div>

        <label className="block">
          <Text variant="label" as="span">
            여행명{" "}
            <Text variant="muted" as="span" className="font-normal">
              (선택)
            </Text>
          </Text>
          <Input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="비우면 도시명이 사용됩니다"
            className="mt-1"
          />
        </label>

        <TripDateRangePicker
          key={editingTrip?.id ?? `create-${isOpen}`}
          startDate={form.startDate}
          endDate={form.endDate}
          onChange={({ startDate, endDate }) => {
            setForm((prev) => ({ ...prev, startDate, endDate }));
            setError("");
          }}
        />

        {isEditing && editingTrip && (
          <div className="space-y-3 border-t border-border pt-4">
            <Text variant="label">여행 상태</Text>
            <Text variant="caption">
              {editingTrip.statusIsManual
                ? "수동으로 설정된 상태입니다."
                : "시작일·종료일 기준으로 자동 관리됩니다."}
            </Text>
            <div className="flex flex-wrap gap-2">
              {tripStatusOptions.map((status) => (
                <Chip
                  key={status}
                  active={editingTrip.status === status}
                  onClick={() => handleStatusChange(status)}
                  className="px-3 py-1.5 text-xs"
                >
                  {tripStatusDisplay[status]}
                </Chip>
              ))}
            </div>
            {editingTrip.statusIsManual && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => resetTripStatusAuto(editingTrip.id)}
                className="h-auto px-0 text-xs font-medium"
              >
                자동 상태로 되돌리기
              </Button>
            )}
          </div>
        )}

        {!isEditing && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3">
            <input
              type="checkbox"
              checked={includeDefaultChecklist}
              onChange={(e) => setIncludeDefaultChecklist(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-border accent-primary"
            />
            <span>
              <Text
                variant="body-medium"
                as="span"
                className="block font-medium"
              >
                기본 체크리스트 추가
              </Text>
              <Text variant="caption" className="mt-1 block">
                예약·여행 준비·짐 등 공통 준비 항목을 자동으로 추가합니다.
              </Text>
            </span>
          </label>
        )}

        {error && (
          <Text variant="body" className="text-danger" role="alert">
            {error}
          </Text>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            취소
          </Button>
          <Button type="submit" className="flex-1">
            저장
          </Button>
        </div>
      </form>
    </OverlayLayer>
  );
}
