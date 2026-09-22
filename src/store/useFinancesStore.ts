import { todayKey } from "@/lib/dates";
import {
  categoryIdFromLabel,
  currentMonthKey,
  EMPTY_FINANCE_DATA,
  findCategoryByLabel,
  inMonth,
  isDayLogged,
  normalizeCategoryLabel,
  salaryForMonth,
  savingForMonth,
} from "@/lib/finances";
import { loadFinances, saveFinances } from "@/lib/storage";
import type {
  ExpenseCategory,
  ExpenseCategoryDef,
  ExpenseSpendBucket,
  FinanceBonus,
  FinanceBucket,
  FinanceData,
  FinanceExpense,
  FinanceSalary,
  FinanceSaving,
} from "@/types";
import { create } from "zustand";

type FinancesState = FinanceData & {
  hydrate: () => void;
  setSplitEnabled: (enabled: boolean) => void;
  setSalary: (month: string, amount: number) => { overwritten: boolean };
  setSaving: (month: string, amount: number) => void;
  deleteSaving: (month: string) => void;
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
  addCategory: (draft: {
    label: string;
    bucket: ExpenseSpendBucket;
  }) => ExpenseCategoryDef | null;
  deleteCategory: (id: string) => void;
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
  deleteMonth: (month: string) => void;
  resetAll: () => void;
};

function persist(data: FinanceData): FinanceData {
  const next: FinanceData = {
    salaries: data.salaries,
    expenses: data.expenses,
    bonuses: data.bonuses,
    savings: data.savings,
    categories: data.categories,
    splitEnabled: data.splitEnabled,
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
  ...EMPTY_FINANCE_DATA,

  hydrate: () => set({ ...loadFinances() }),

  setSplitEnabled: (enabled) => {
    set(persist({ ...get(), splitEnabled: enabled }));
  },

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
    const savings = existing
      ? state.savings.filter((entry) => entry.month !== month)
      : state.savings;
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
        savings,
        confirmedLogDates,
        dismissedExpenseDate,
        expenseNotifiedDate,
        dismissedSalaryMonth:
          month === currentMonthKey() ? month : state.dismissedSalaryMonth,
      }),
    );
    return { overwritten: Boolean(existing) };
  },

  setSaving: (month, amount) => {
    const state = get();
    const existing = savingForMonth(state, month);
    const now = nowIso();
    if (amount <= 0) {
      if (!existing) return;
      set(
        persist({
          ...state,
          savings: state.savings.filter((entry) => entry.month !== month),
        }),
      );
      return;
    }
    const next: FinanceSaving = existing
      ? { ...existing, amount, updatedAt: now }
      : {
          id: crypto.randomUUID(),
          month,
          amount,
          createdAt: now,
          updatedAt: now,
        };
    const savings = existing
      ? state.savings.map((entry) => (entry.month === month ? next : entry))
      : [...state.savings, next];
    set(persist({ ...state, savings }));
  },

  deleteSaving: (month) => {
    const state = get();
    if (!savingForMonth(state, month)) return;
    set(
      persist({
        ...state,
        savings: state.savings.filter((entry) => entry.month !== month),
      }),
    );
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

  addCategory: (draft) => {
    const label = normalizeCategoryLabel(draft.label);
    if (!label) return null;
    const state = get();
    const existing = findCategoryByLabel(label, draft.bucket, state.categories);
    if (existing) return existing;
    const category: ExpenseCategoryDef = {
      id: categoryIdFromLabel(
        label,
        state.categories.map((entry) => entry.id),
      ),
      label,
      bucket: draft.bucket,
    };
    set(persist({ ...state, categories: [...state.categories, category] }));
    return category;
  },

  deleteCategory: (id) => {
    const state = get();
    set(
      persist({
        ...state,
        categories: state.categories.filter((entry) => entry.id !== id),
        expenses: state.expenses.filter((entry) => entry.category !== id),
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

  deleteMonth: (month) => {
    const state = get();
    set(
      persist({
        ...state,
        salaries: state.salaries.filter((entry) => entry.month !== month),
        expenses: state.expenses.filter((entry) => !inMonth(entry.date, month)),
        bonuses: state.bonuses.filter((entry) => !inMonth(entry.date, month)),
        savings: state.savings.filter((entry) => entry.month !== month),
        confirmedLogDates: state.confirmedLogDates.filter(
          (date) => !inMonth(date, month),
        ),
        dismissedSalaryMonth:
          state.dismissedSalaryMonth === month
            ? null
            : state.dismissedSalaryMonth,
        salaryNotifiedMonth:
          state.salaryNotifiedMonth === month ? null : state.salaryNotifiedMonth,
        dismissedExpenseDate:
          state.dismissedExpenseDate &&
          inMonth(state.dismissedExpenseDate, month)
            ? null
            : state.dismissedExpenseDate,
        expenseNotifiedDate:
          state.expenseNotifiedDate && inMonth(state.expenseNotifiedDate, month)
            ? null
            : state.expenseNotifiedDate,
      }),
    );
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
