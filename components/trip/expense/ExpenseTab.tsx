"use client";

import { useMemo, useState } from "react";
import type { Trip } from "@/types/trip";
import type { ExpenseInput } from "@/types/expense";
import { useTripDetail } from "@/contexts/TripDetailContext";
import { formatExchangeRateLabel, tripHasExchangeRate } from "@/lib/currency-utils";
import {
  createExpenseFromInput,
  getExpenseCategoryTotals,
  expenseCategoryLabels,
  formatExpenseDate,
  formatExpenseDisplay,
  formatExpenseTotalDisplay,
} from "@/lib/expense-utils";
import { Card, Text } from "@/components/ui";
import TripTabHeader from "../TripTabHeader";
import ExpenseModal from "./ExpenseModal";

interface ExpenseTabProps {
  trip: Trip;
}

function ExpenseTabContent({ trip }: ExpenseTabProps) {
  const { data, updateData } = useTripDetail();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const expenses = data.expenses;
  const hasRate = tripHasExchangeRate(trip);

  const sortedExpenses = [...expenses].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const totalDisplay = useMemo(
    () => formatExpenseTotalDisplay(expenses, trip),
    [expenses, trip],
  );
  const categoryTotals = useMemo(
    () => getExpenseCategoryTotals(expenses, trip),
    [expenses, trip],
  );

  const handleSave = (input: ExpenseInput) => {
    const newItem = createExpenseFromInput(input, trip);

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

      {(totalDisplay.secondary || (hasRate && trip.exchangeRate != null)) && (
        <div className="space-y-0.5">
          {totalDisplay.secondary && (
            <Text variant="caption" className="text-primary">
              {totalDisplay.secondary}
            </Text>
          )}
          {hasRate && trip.exchangeRate != null && (
            <Text variant="caption" className="text-[11px]">
              {formatExchangeRateLabel(trip.currency, trip.exchangeRate)}
            </Text>
          )}
        </div>
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
            const display = formatExpenseDisplay(item, trip);

            return (
              <li key={item.id}>
                <Card padding="none" className="px-2.5 py-2">
                  <Text variant="body-medium" className="text-[13px] font-semibold">
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
        trip={trip}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}

/** 지출기록 탭 — TripDetailData.expenses 사용 */
export default function ExpenseTab({ trip }: ExpenseTabProps) {
  return <ExpenseTabContent trip={trip} />;
}
