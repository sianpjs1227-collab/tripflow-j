"use client";

import { useState } from "react";
import type { Expense, ExpenseInput } from "@/types/expense";
import { useTripDetail } from "@/contexts/TripDetailContext";
import {
  expenseCategoryLabels,
  formatExpenseAmount,
  formatExpenseDate,
  generateExpenseId,
} from "@/lib/expense-utils";
import ExpenseModal from "./ExpenseModal";

function ExpenseTabContent() {
  const { data, updateData } = useTripDetail();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const expenses = data.expenses;

  const sortedExpenses = [...expenses].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

  const handleSave = (input: ExpenseInput) => {
    const newItem: Expense = {
      id: generateExpenseId(),
      date: input.date,
      amount: Number(input.amount),
      category: input.category,
      memo: input.memo.trim() || undefined,
    };

    updateData((prev) => ({
      ...prev,
      expenses: [newItem, ...prev.expenses],
    }));
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold">지출기록</h2>
      <p className="mt-2 text-sm text-[#6e6e73]">
        총 지출: {formatExpenseAmount(totalAmount)}
      </p>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="mt-4 w-full rounded-xl bg-[#0A84FF] py-3 text-sm font-semibold text-white"
      >
        지출 추가
      </button>

      {expenses.length === 0 ? (
        <p className="mt-6 text-sm text-[#6e6e73]">
          아직 등록된 지출이 없습니다.
        </p>
      ) : (
        <ul className="mt-6 space-y-2" role="list">
          {sortedExpenses.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[#ebebeb] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-medium text-[#111111] dark:text-white">
                    {formatExpenseAmount(item.amount)}
                  </p>
                  <p className="mt-1 text-sm text-[#6e6e73]">
                    {formatExpenseDate(item.date)} ·{" "}
                    {expenseCategoryLabels[item.category]}
                  </p>
                  {item.memo && (
                    <p className="mt-1 text-sm text-[#6e6e73]">{item.memo}</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}

/**
 * 지출기록 탭 — TripDetailData.expenses 사용
 */
export default function ExpenseTab() {
  return <ExpenseTabContent />;
}
