import { monthKey, monthName, monthTitle, parseDateKey } from "@/lib/dates";
import type {
  ExpenseCategory,
  ExpenseCategoryDef,
  ExpenseSpendBucket,
  FinanceBonus,
  FinanceBucket,
  FinanceData,
  FinanceExpense,
  FinanceSalary,
} from "@/types";

export const CATEGORY_LABEL_MAX = 40;

export const EXPENSE_CATEGORIES: ExpenseCategoryDef[] = [
  { id: "stanarina", label: "Stanarina", bucket: "needs" },
  { id: "gorivo", label: "Gorivo", bucket: "needs" },
  { id: "racuni", label: "Računi", bucket: "needs" },
  { id: "nabavka", label: "Nabavka", bucket: "needs" },
  { id: "kafic", label: "Kafić", bucket: "wants" },
  { id: "brza-hrana", label: "Brza hrana", bucket: "wants" },
  { id: "bioskop", label: "Bioskop", bucket: "wants" },
  { id: "subskripcije", label: "Subskripcije", bucket: "wants" },
  { id: "soping", label: "Šoping", bucket: "wants" },
];

export const EMPTY_FINANCE_DATA: FinanceData = {
  salaries: [],
  expenses: [],
  bonuses: [],
  categories: EXPENSE_CATEGORIES.map((entry) => ({ ...entry })),
  confirmedLogDates: [],
  dismissedSalaryMonth: null,
  dismissedExpenseDate: null,
  salaryNotifiedMonth: null,
  expenseNotifiedDate: null,
};

export const BUCKETS: {
  id: FinanceBucket;
  label: string;
  shortLabel: string;
  subtitle: string;
  ratio: number;
  percent: string;
}[] = [
  {
    id: "needs",
    label: "Housings",
    shortLabel: "Housings",
    subtitle: "Stanarina, gorivo, računi, nabavka",
    ratio: 0.5,
    percent: "50%",
  },
  {
    id: "wants",
    label: "funnymoney",
    shortLabel: "funnymoney",
    subtitle: "Kafić, brza hrana, bioskop, subskripcije, šoping",
    ratio: 0.3,
    percent: "30%",
  },
  {
    id: "savings",
    label: "Ušteđevina",
    shortLabel: "Ušteđevina",
    subtitle: "Zaključano — ne troši se",
    ratio: 0.2,
    percent: "20%",
  },
];

const BUCKET_BY_ID = Object.fromEntries(
  BUCKETS.map((entry) => [entry.id, entry]),
) as Record<FinanceBucket, (typeof BUCKETS)[number]>;

const rsdFormat = new Intl.NumberFormat("sr-RS", {
  maximumFractionDigits: 0,
});

export function bucketMeta(id: FinanceBucket) {
  return BUCKET_BY_ID[id];
}

export function resolveCategories(
  categories: readonly ExpenseCategoryDef[] | undefined,
): ExpenseCategoryDef[] {
  if (!categories) return EXPENSE_CATEGORIES.map((entry) => ({ ...entry }));
  return [...categories];
}

function categoryById(
  categories: readonly ExpenseCategoryDef[],
): Record<string, ExpenseCategoryDef> {
  return Object.fromEntries(categories.map((entry) => [entry.id, entry]));
}

export function categoryMeta(
  id: ExpenseCategory,
  categories: readonly ExpenseCategoryDef[],
): ExpenseCategoryDef {
  return (
    categoryById(categories)[id] ?? {
      id,
      label: id,
      bucket: "needs",
    }
  );
}

export function categoriesForBucket(
  bucket: FinanceBucket,
  categories: readonly ExpenseCategoryDef[],
) {
  return categories.filter((entry) => entry.bucket === bucket);
}

export function normalizeCategoryLabel(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, CATEGORY_LABEL_MAX);
}

export function categoryIdFromLabel(
  label: string,
  used: Iterable<string>,
): string {
  const taken = used instanceof Set ? used : new Set(used);
  const base =
    label
      .trim()
      .toLocaleLowerCase("sr-Latn")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, CATEGORY_LABEL_MAX) || "kategorija";
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function findCategoryByLabel(
  label: string,
  bucket: ExpenseSpendBucket,
  categories: readonly ExpenseCategoryDef[],
): ExpenseCategoryDef | undefined {
  const normalized = normalizeCategoryLabel(label);
  if (!normalized) return undefined;
  return categories.find(
    (entry) =>
      entry.bucket === bucket &&
      entry.label.localeCompare(normalized, "sr-Latn", {
        sensitivity: "base",
      }) === 0,
  );
}

export function currentMonthKey(): string {
  return monthKey(new Date());
}

export function parseMonthKey(key: string): Date {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export function monthTitleFromKey(key: string): string {
  return monthTitle(parseMonthKey(key));
}

export function formatRsdNumber(amount: number): string {
  return rsdFormat.format(Math.round(amount));
}

export function formatRsd(amount: number): string {
  return `${formatRsdNumber(amount)} RSD`;
}

export function parseAmount(
  raw: string,
  options?: { allowZero?: boolean },
): number | null {
  const cleaned = raw.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  if (options?.allowZero ? value < 0 : value <= 0) return null;
  return Math.round(value);
}

export function allocateSalary(salary: number): Record<FinanceBucket, number> {
  const needs = Math.round(salary * 0.5);
  const wants = Math.round(salary * 0.3);
  const savings = salary - needs - wants;
  return { needs, wants, savings };
}

export type MonthSummary = {
  month: string;
  salary: number;
  leftoverSalary: number;
  totalBonus: number;
  totalWithBonus: number;
  cardsRemaining: number;
  alloc: Record<FinanceBucket, number>;
  bonusByBucket: Record<FinanceBucket, number>;
  spentByBucket: Record<FinanceBucket, number>;
  remainingByBucket: Record<FinanceBucket, number>;
  spentByCategory: Record<ExpenseCategory, number>;
  expenses: FinanceExpense[];
  bonuses: FinanceBonus[];
};

function emptyBuckets(): Record<FinanceBucket, number> {
  return { needs: 0, wants: 0, savings: 0 };
}

function emptyCategories(
  categories: readonly ExpenseCategoryDef[],
): Record<ExpenseCategory, number> {
  return Object.fromEntries(categories.map((entry) => [entry.id, 0]));
}

export function inMonth(dateKey: string, month: string): boolean {
  return dateKey.startsWith(month);
}

export function summarizeMonth(month: string, data: FinanceData): MonthSummary {
  const categories = resolveCategories(data.categories);
  const byId = categoryById(categories);
  const salary = data.salaries.find((entry) => entry.month === month)?.amount ?? 0;
  const expenses = data.expenses
    .filter((entry) => inMonth(entry.date, month))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const bonuses = data.bonuses
    .filter((entry) => inMonth(entry.date, month))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  const alloc = allocateSalary(salary);
  const bonusByBucket = emptyBuckets();
  for (const bonus of bonuses) bonusByBucket[bonus.bucket] += bonus.amount;

  const spentByBucket = emptyBuckets();
  const spentByCategory = emptyCategories(categories);
  for (const expense of expenses) {
    const bucket = byId[expense.category]?.bucket;
    if (bucket) spentByBucket[bucket] += expense.amount;
    spentByCategory[expense.category] =
      (spentByCategory[expense.category] ?? 0) + expense.amount;
  }

  const remainingByBucket: Record<FinanceBucket, number> = {
    needs: alloc.needs + bonusByBucket.needs - spentByBucket.needs,
    wants: alloc.wants + bonusByBucket.wants - spentByBucket.wants,
    savings: alloc.savings + bonusByBucket.savings - spentByBucket.savings,
  };

  const totalExpenses = expenses.reduce((sum, entry) => sum + entry.amount, 0);
  const totalBonus = bonuses.reduce((sum, entry) => sum + entry.amount, 0);
  const leftoverSalary = Math.max(0, salary - totalExpenses);
  const totalWithBonus = leftoverSalary + totalBonus - Math.max(0, totalExpenses - salary);
  const cardsRemaining = remainingByBucket.needs + remainingByBucket.wants;

  return {
    month,
    salary,
    leftoverSalary,
    totalBonus,
    totalWithBonus,
    cardsRemaining,
    alloc,
    bonusByBucket,
    spentByBucket,
    remainingByBucket,
    spentByCategory,
    expenses,
    bonuses,
  };
}

export function listHistoryMonths(data: FinanceData): string[] {
  const months = new Set<string>();
  for (const salary of data.salaries) months.add(salary.month);
  for (const expense of data.expenses) months.add(expense.date.slice(0, 7));
  for (const bonus of data.bonuses) months.add(bonus.date.slice(0, 7));
  return [...months].sort((a, b) => b.localeCompare(a));
}

export function salaryForMonth(
  data: FinanceData,
  month: string,
): FinanceSalary | undefined {
  return data.salaries.find((entry) => entry.month === month);
}

export function hasExpenseOnDate(data: FinanceData, date: string): boolean {
  return data.expenses.some((entry) => entry.date === date);
}

export function isDayLogged(data: FinanceData, date: string): boolean {
  return (
    data.confirmedLogDates.includes(date) || hasExpenseOnDate(data, date)
  );
}

export function isTenthOrLater(date = new Date()): boolean {
  return date.getDate() >= 10;
}

export function isAfterOrAtHour(hour: number, date = new Date()): boolean {
  return date.getHours() > hour || date.getHours() === hour;
}

export function msUntilDate(target: Date): number {
  return Math.max(0, target.getTime() - Date.now());
}

export function nextDailyReminderAt(hour = 22, from = new Date()): Date {
  const next = new Date(from);
  next.setHours(hour, 0, 0, 0);
  if (next.getTime() <= from.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export function nextSalaryReminderAt(from = new Date()): Date {
  const next = new Date(from.getFullYear(), from.getMonth(), 10, 9, 0, 0, 0);
  if (next.getTime() <= from.getTime()) {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export function currentYearMonthChoices(
  now = new Date(),
): { value: string; label: string }[] {
  const year = now.getFullYear();
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(year, index, 1);
    return { value: monthKey(date), label: monthName(date) };
  });
}

export function monthKeyInCurrentYear(month: string, now = new Date()): string {
  const mm = month.slice(5, 7);
  if (!/^(0[1-9]|1[0-2])$/.test(mm)) return currentMonthKey();
  return `${now.getFullYear()}-${mm}`;
}

export function formatExpenseDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return date.toLocaleDateString("sr-Latn-RS", {
    day: "numeric",
    month: "short",
  });
}
