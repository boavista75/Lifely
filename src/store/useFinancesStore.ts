import { EMPTY_FINANCE_DATA } from "@/lib/finances";
import { todayKey } from "@/lib/dates";
import {
  currentMonthKey,
  inMonth,
  isDayLogged,
  salaryForMonth,
} from "@/lib/finances";
import { loadFinances, saveFinances } from "@/lib/storage";
import type {
  ExpenseCategory,
  FinanceBonus,
  FinanceBucket,
  FinanceData,
  FinanceExpense,
  FinanceSalary,
} from "@/types";
import { create } from "zustand";

type FinancesState = FinanceData & {
  setSalary: (month: string, amount: number) => { overwritten: boolean };
  addExpense: (draft: {
    category: ExpenseCategory;
    amount: number;
    date: string;
  }) => FinanceExpense;
  updateExpense: (
    id: string,
    patch: Partial<Pick<FinanceExpense, "category" | "amount" | "date">>,
  ) => void;
  deleteExpense: (id: string) => void;
  addBonus: (draft: {
    amount: number;
    bucket: FinanceBucket;
    date: string;
  }) => FinanceBonus;
  deleteBonus: (id: string) => void;
  confirmNoSpendToday: (date: string) => void;
  dismissSalaryReminder: (month: string) => void;
  dismissExpenseReminder: (date: string) => void;
  markSalaryNotified: (month: string) => void;
  markExpenseNotified: (date: string) => void;
  resetAll: () => void;
};

function persist(data: FinanceData): FinanceData {
  const next: FinanceData = {
    salaries: data.salaries,
    expenses: data.expenses,
    bonuses: data.bonuses,
    confirmedLogDates: data.confirmedLogDates,
    dismissedSalaryMonth: data.dismissedSalaryMonth,
    dismissedExpenseDate: data.dismissedExpenseDate,
    salaryNotifiedMonth: data.salaryNotifiedMonth,
    expenseNotifiedDate: data.expenseNotifiedDate,
  };
  saveFinances(next);
  return next;
}

function nowIso(): string {
  return new Date().toISOString();
}

export const useFinancesStore = create<FinancesState>((set, get) => ({
  ...loadFinances(),

  setSalary: (month, amount) => {
    const state = get();
    const existing = salaryForMonth(state, month);
    const now = nowIso();
    const next: FinanceSalary = existing
      ? { ...existing, amount, updatedAt: now }
      : {
          id: crypto.randomUUID(),
          month,
          amount,
          createdAt: now,
          updatedAt: now,
        };
    const salaries = existing
      ? state.salaries.map((entry) => (entry.month === month ? next : entry))
      : [...state.salaries, next];
    const expenses = existing
      ? state.expenses.filter((entry) => !inMonth(entry.date, month))
      : state.expenses;
    const confirmedLogDates = existing
      ? state.confirmedLogDates.filter((date) => !inMonth(date, month))
      : state.confirmedLogDates;
    const dismissedExpenseDate =
      existing &&
      state.dismissedExpenseDate &&
      inMonth(state.dismissedExpenseDate, month)
        ? null
        : state.dismissedExpenseDate;
    const expenseNotifiedDate =
      existing &&
      state.expenseNotifiedDate &&
      inMonth(state.expenseNotifiedDate, month)
        ? null
        : state.expenseNotifiedDate;
    set(
      persist({
        ...state,
        salaries,
        expenses,
        confirmedLogDates,
        dismissedExpenseDate,
        expenseNotifiedDate,
        dismissedSalaryMonth:
          month === currentMonthKey() ? month : state.dismissedSalaryMonth,
      }),
    );
    return { overwritten: Boolean(existing) };
  },

  addExpense: (draft) => {
    const expense: FinanceExpense = {
      id: crypto.randomUUID(),
      category: draft.category,
      amount: draft.amount,
      date: draft.date,
      createdAt: nowIso(),
    };
    const confirmedLogDates = get().confirmedLogDates.includes(draft.date)
      ? get().confirmedLogDates
      : [...get().confirmedLogDates, draft.date];
    set(
      persist({
        ...get(),
        expenses: [expense, ...get().expenses],
        confirmedLogDates,
      }),
    );
    return expense;
  },

  updateExpense: (id, patch) => {
    set(
      persist({
        ...get(),
        expenses: get().expenses.map((entry) =>
          entry.id === id ? { ...entry, ...patch } : entry,
        ),
      }),
    );
  },

  deleteExpense: (id) => {
    set(
      persist({
        ...get(),
        expenses: get().expenses.filter((entry) => entry.id !== id),
      }),
    );
  },

  addBonus: (draft) => {
    const bonus: FinanceBonus = {
      id: crypto.randomUUID(),
      amount: draft.amount,
      bucket: draft.bucket,
      date: draft.date,
      createdAt: nowIso(),
    };
    set(persist({ ...get(), bonuses: [bonus, ...get().bonuses] }));
    return bonus;
  },

  deleteBonus: (id) => {
    set(
      persist({
        ...get(),
        bonuses: get().bonuses.filter((entry) => entry.id !== id),
      }),
    );
  },

  confirmNoSpendToday: (date) => {
    if (get().confirmedLogDates.includes(date)) return;
    set(
      persist({
        ...get(),
        confirmedLogDates: [...get().confirmedLogDates, date],
        dismissedExpenseDate: date,
      }),
    );
  },

  dismissSalaryReminder: (month) => {
    set(persist({ ...get(), dismissedSalaryMonth: month }));
  },

  dismissExpenseReminder: (date) => {
    set(persist({ ...get(), dismissedExpenseDate: date }));
  },

  markSalaryNotified: (month) => {
    set(persist({ ...get(), salaryNotifiedMonth: month }));
  },

  markExpenseNotified: (date) => {
    set(persist({ ...get(), expenseNotifiedDate: date }));
  },

  resetAll: () => {
    set(persist({ ...EMPTY_FINANCE_DATA }));
  },
}));

export function shouldShowSalaryReminder(data: FinanceData, now = new Date()): boolean {
  const month = currentMonthKey();
  if (now.getDate() < 10) return false;
  if (salaryForMonth(data, month)) return false;
  return data.dismissedSalaryMonth !== month;
}

export function shouldShowExpenseReminder(data: FinanceData, now = new Date()): boolean {
  if (now.getHours() < 22) return false;
  const date = todayKey();
  if (isDayLogged(data, date)) return false;
  return data.dismissedExpenseDate !== date;
}
