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
import { Button, Card, Text } from "@/components/ui";
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
    <div className="space-y-4">
      <Text variant="title-sm" as="h2">
        지출기록
      </Text>

      <div className="mt-2 space-y-1">
        <Text variant="body-medium">{totalDisplay.primary}</Text>
        {totalDisplay.secondary && (
          <Text variant="body" className="text-primary">
            {totalDisplay.secondary}
          </Text>
        )}
        {hasRate && trip.exchangeRate != null && (
          <Text variant="muted">
            {formatExchangeRateLabel(trip.currency, trip.exchangeRate)}
          </Text>
        )}
      </div>

      {categoryTotals.length > 0 && (
        <Card padding="sm" className="space-y-2">
          <Text variant="body-medium">카테고리별 합계</Text>
          <div className="space-y-1.5">
            {categoryTotals.map((item) => (
              <div
                key={item.category}
                className="flex items-start justify-between gap-3"
              >
                <Text variant="muted">{expenseCategoryLabels[item.category]}</Text>
                <div className="text-right">
                  <Text variant="body-medium">{item.primary}</Text>
                  {item.secondary && (
                    <Text variant="caption" className="text-primary">
                      {item.secondary}
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Button type="button" onClick={() => setIsModalOpen(true)} className="w-full">
        지출 추가
      </Button>

      {expenses.length === 0 ? (
        <Text variant="muted" className="mt-6">
          아직 등록된 지출이 없습니다.
        </Text>
      ) : (
        <ul className="mt-6 space-y-2" role="list">
          {sortedExpenses.map((item) => {
            const display = formatExpenseDisplay(item, trip);

            return (
              <li key={item.id}>
                <Card padding="sm">
                  <Text variant="body-medium" className="text-base">
                    {display.title}
                  </Text>
                  <Text variant="body-medium" className="mt-1 text-base">
                    {display.primary}
                  </Text>
                  {display.secondary && (
                    <Text variant="body" className="mt-0.5 text-primary">
                      {display.secondary}
                    </Text>
                  )}
                  <Text variant="muted" className="mt-1">
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
