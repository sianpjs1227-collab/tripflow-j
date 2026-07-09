"use client";

import { useMemo, useState } from "react";
import type { Trip } from "@/types/trip";
import type { ExpenseCategory, ExpenseInput } from "@/types/expense";
import {
  convertToKrw,
  formatExchangeRateLabel,
  formatKrwAmount,
  tripHasExchangeRate,
} from "@/lib/currency-utils";
import { formatExpenseAmount } from "@/lib/expense-utils";
import { Button, Card, Input, OverlayLayer, Text } from "@/components/ui";

interface ExpenseModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: ExpenseInput) => void;
}

const EMPTY_FORM: ExpenseInput = {
  date: "",
  amount: "",
  category: "food",
  memo: "",
};

const selectClassName =
  "mt-1 h-10 w-full rounded-xl border border-border bg-card px-3.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

/**
 * 지출 추가 모달
 */
export default function ExpenseModal({
  trip,
  isOpen,
  onClose,
  onSave,
}: ExpenseModalProps) {
  const [form, setForm] = useState<ExpenseInput>(EMPTY_FORM);
  const [error, setError] = useState("");

  const hasRate = tripHasExchangeRate(trip);
  const localAmount = Number(form.amount);

  const krwPreview = useMemo(() => {
    if (
      !hasRate ||
      !form.amount.trim() ||
      Number.isNaN(localAmount) ||
      localAmount <= 0 ||
      trip.exchangeRate == null
    ) {
      return null;
    }
    return formatKrwAmount(convertToKrw(localAmount, trip.exchangeRate));
  }, [hasRate, form.amount, localAmount, trip.exchangeRate]);

  const handleChange = (
    field: keyof ExpenseInput,
    value: string | ExpenseCategory,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.date || !form.amount.trim()) {
      setError("날짜와 금액을 입력해주세요.");
      return;
    }

    const amount = Number(form.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      setError("올바른 금액을 입력해주세요.");
      return;
    }

    onSave(form);
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  return (
    <OverlayLayer
      isOpen={isOpen}
      sheet
      onClose={handleClose}
      closeLabel="모달 닫기"
    >
        <Text variant="title-sm" as="h2" className="text-xl font-bold">
          지출 추가
        </Text>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <Text variant="label" as="span">
              날짜
            </Text>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="mt-1"
            />
          </label>

          <label className="block">
            <Text variant="label" as="span">
              {hasRate ? `현지 금액 (${trip.currency})` : "금액 (KRW)"}
            </Text>
            <Input
              type="number"
              min="1"
              step="any"
              value={form.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              placeholder={hasRate ? "예: 1280" : "예: 15000"}
              className="mt-1"
            />
          </label>

          {hasRate && trip.exchangeRate != null && (
            <Card padding="sm" className="bg-primary/5">
              <Text variant="caption">환율</Text>
              <Text variant="body-medium" className="mt-1">
                {formatExchangeRateLabel(trip.currency, trip.exchangeRate)}
              </Text>
              {form.amount.trim() &&
                !Number.isNaN(localAmount) &&
                localAmount > 0 && (
                  <div className="mt-3 border-t border-border pt-3">
                    <Text variant="caption">원화 금액</Text>
                    <Text
                      variant="body-medium"
                      className="mt-1 text-lg font-semibold text-primary"
                    >
                      {krwPreview ?? "-"}
                    </Text>
                    {krwPreview && (
                      <Text variant="caption" className="mt-1">
                        {formatExpenseAmount(localAmount, trip.currency)} →{" "}
                        {krwPreview}
                      </Text>
                    )}
                  </div>
                )}
            </Card>
          )}

          <label className="block">
            <Text variant="label" as="span">
              이름 / 메모{" "}
              <Text variant="muted" as="span">(선택)</Text>
            </Text>
            <Input
              type="text"
              value={form.memo}
              onChange={(e) => handleChange("memo", e.target.value)}
              placeholder="예: 이치란, 스타벅스"
              className="mt-1"
            />
          </label>

          <label className="block">
            <Text variant="label" as="span">
              분류
            </Text>
            <select
              value={form.category}
              onChange={(e) =>
                handleChange("category", e.target.value as ExpenseCategory)
              }
              className={selectClassName}
            >
              <option value="transport">교통</option>
              <option value="food">식비</option>
              <option value="cafe">카페</option>
              <option value="shopping">쇼핑</option>
              <option value="other">기타</option>
            </select>
          </label>

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
