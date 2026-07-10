"use client";

import { useEffect, useMemo, useState } from "react";
import { COUNTRIES, getCurrencyCodeByCountryCode } from "@/data/countries";
import type { CreateTripInput, Trip, TripStatus } from "@/types/trip";
import { useTrips } from "@/contexts/TripContext";
import {
  displayDateToIso,
  getCountryCodeByName,
} from "@/lib/trip-utils";
import {
  formatExchangeRateLabel,
  parseExchangeRateInput,
} from "@/lib/currency-utils";
import {
  tripStatusDisplay,
  tripStatusOptions,
} from "@/lib/trip-status";
import { Button, Card, Chip, Input, OverlayLayer, Text } from "@/components/ui";
import CityAutocomplete from "./CityAutocomplete";
import TripCoverPicker from "./TripCoverPicker";
import TripDateRangePicker from "./TripDateRangePicker";

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
  exchangeRate: "",
  coverImage: "",
};

const selectClassName =
  "country-flag mt-1 h-10 w-full rounded-xl border border-border bg-card px-3.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

/**
 * 새 여행 생성 / 여행 수정 모달
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
  const isEditing = editingTrip !== null;

  const currency = form.countryCode
    ? getCurrencyCodeByCountryCode(form.countryCode)
    : "";
  const isKrwTrip = currency === "KRW";

  const exchangeRateLabel = useMemo(() => {
    const rate = parseExchangeRateInput(form.exchangeRate);
    if (!currency || isKrwTrip || rate == null) return null;
    return formatExchangeRateLabel(currency, rate);
  }, [currency, isKrwTrip, form.exchangeRate]);

  useEffect(() => {
    if (!isOpen) return;

    if (editingTrip) {
      const city = editingTrip.city || editingTrip.name;
      const hasCustomName =
        editingTrip.name.trim() !== "" && editingTrip.name !== city;

      setForm({
        name: hasCustomName ? editingTrip.name : "",
        countryCode:
          editingTrip.countryCode ||
          getCountryCodeByName(editingTrip.country),
        city,
        startDate: displayDateToIso(editingTrip.startDate),
        endDate: displayDateToIso(editingTrip.endDate),
        exchangeRate:
          editingTrip.exchangeRate != null && editingTrip.exchangeRate > 0
            ? String(editingTrip.exchangeRate)
            : "",
        coverImage: editingTrip.coverImage ?? "",
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        countryCode: initialCountryCode.trim(),
      });
      setIncludeDefaultChecklist(true);
      setFocusCityInput(Boolean(initialCountryCode.trim()));
    }
    setError("");
    if (editingTrip) {
      setFocusCityInput(false);
    }
  }, [isOpen, editingTrip, initialCountryCode]);

  const handleChange = (field: keyof CreateTripInput, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "countryCode") {
        const nextCurrency = getCurrencyCodeByCountryCode(value);
        next.city = "";
        if (nextCurrency === "KRW") {
          next.exchangeRate = "";
        }
        if (value) {
          setFocusCityInput(true);
        }
      }

      return next;
    });
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.countryCode || !form.city.trim() || !form.startDate || !form.endDate) {
      setError("국가, 도시, 날짜를 입력해주세요.");
      return;
    }

    if (form.endDate < form.startDate) {
      setError("종료일은 시작일 이후여야 합니다.");
      return;
    }

    onSave({
      ...form,
      includeDefaultChecklist: isEditing ? undefined : includeDefaultChecklist,
    });
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setError("");
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

          {currency && (
            <Card padding="sm" className="bg-primary/5">
              <Text variant="muted">기본 통화</Text>
              <Text variant="body-medium" className="mt-1 font-medium">
                {currency}
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

          {currency && !isKrwTrip && (
            <label className="block">
              <Text variant="label" as="span">
                환율 (1 {currency} = ? KRW){" "}
                <Text variant="muted" as="span" className="font-normal">
                  (선택)
                </Text>
              </Text>
              <Input
                type="number"
                min="0"
                step="0.0001"
                value={form.exchangeRate}
                onChange={(e) => handleChange("exchangeRate", e.target.value)}
                placeholder="예: 9.31"
                className="mt-1"
              />
              {exchangeRateLabel && (
                <Text variant="caption" className="mt-1">
                  {exchangeRateLabel}
                </Text>
              )}
              <Text variant="caption" className="mt-1">
                비우면 원화(KRW)로 지출을 기록합니다.
              </Text>
            </label>
          )}

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
                <Text variant="body-medium" as="span" className="block font-medium">
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
