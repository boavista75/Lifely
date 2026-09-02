import { EMPTY_FINANCE_DATA } from "@/lib/finances";
import { clampKbTextScale, KB_TEXT_SCALE_DEFAULT, isKbFile, isKbPage } from "@/lib/kb";
import {
  clampSidebarWidth,
  SIDEBAR_WIDTH_DEFAULT,
} from "@/lib/sidebar";
import {
  applyPaletteVars,
  DEFAULT_PALETTE_ID,
  getPalette,
  isPaletteId,
  type PaletteId,
} from "@/lib/palettes";
import type {
  ExpenseCategory,
  FinanceBonus,
  FinanceBucket,
  FinanceData,
  FinanceExpense,
  FinanceSalary,
  LifelyItem,
  LifelyKbNode,
  LifelyNote,
  TabId,
} from "@/types";

const ITEMS_KEY = "lifely-items";
const NOTES_KEY = "lifely-notes";
const KB_KEY = "lifely-kb";
const TAB_KEY = "lifely-tab";
const THEME_KEY = "lifely-theme";
const SIDEBAR_WIDTH_KEY = "lifely-sidebar-width";
const PALETTE_KEY = "lifely-palette";
const FINANCES_KEY = "lifely-finances";

const BUCKETS: FinanceBucket[] = ["needs", "wants", "savings"];
const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "stanarina",
  "gorivo",
  "racuni",
  "nabavka",
  "kafic",
  "brza-hrana",
  "bioskop",
  "subskripcije",
  "soping",
];

const LEGACY_EXPENSE_CATEGORIES: Record<string, ExpenseCategory> = {
  nabavke: "nabavka",
  izlazci: "kafic",
};

const TABS: TabId[] = [
  "calendar",
  "todo",
  "notes",
  "knowledge",
  "finances",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isItem(value: unknown): value is Omit<LifelyItem, "noteId" | "kbPageId"> & {
  noteId?: string | null;
  kbPageId?: string | null;
} {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.date === "string" &&
    (value.timeMode === "none" ||
      value.timeMode === "start" ||
      value.timeMode === "range") &&
    (value.startTime === null || typeof value.startTime === "string") &&
    (value.endTime === null || typeof value.endTime === "string") &&
    typeof value.completed === "boolean" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    (value.noteId === undefined ||
      value.noteId === null ||
      typeof value.noteId === "string") &&
    (value.kbPageId === undefined ||
      value.kbPageId === null ||
      typeof value.kbPageId === "string")
  );
}

function isNote(value: unknown): value is LifelyNote {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.content === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

export function loadItems(): LifelyItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isItem).map((item) => ({
      ...item,
      noteId: item.noteId ?? null,
      kbPageId: item.kbPageId ?? null,
    }));
  } catch {
    return [];
  }
}

export function saveItems(items: LifelyItem[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function loadNotes(): LifelyNote[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isNote);
  } catch {
    return [];
  }
}

export function saveNotes(notes: LifelyNote[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function isKbNode(value: unknown): value is LifelyKbNode {
  if (!isRecord(value)) return false;
  const base =
    typeof value.id === "string" &&
    (value.parentId === null || typeof value.parentId === "string") &&
    typeof value.title === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string";
  if (!base) return false;
  if (value.kind === "folder") return true;
  if (value.kind === "file") {
    return (
      typeof value.mediaId === "string" &&
      typeof value.mimeType === "string" &&
      typeof value.size === "number" &&
      Number.isFinite(value.size) &&
      (value.content === undefined ||
        value.content === null ||
        typeof value.content === "string") &&
      (value.textScale === undefined ||
        (typeof value.textScale === "number" && Number.isFinite(value.textScale)))
    );
  }
  if (value.kind !== "page" || typeof value.content !== "string") return false;
  return (
    value.textScale === undefined ||
    (typeof value.textScale === "number" && Number.isFinite(value.textScale))
  );
}

function withTextScale(node: LifelyKbNode): LifelyKbNode {
  if (isKbPage(node)) {
    return {
      ...node,
      textScale: clampKbTextScale(node.textScale ?? KB_TEXT_SCALE_DEFAULT),
    };
  }
  if (isKbFile(node)) {
    return {
      ...node,
      content: node.content ?? null,
      textScale: clampKbTextScale(node.textScale ?? KB_TEXT_SCALE_DEFAULT),
    };
  }
  return node;
}

export function loadKb(): LifelyKbNode[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KB_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isKbNode).map(withTextScale);
  } catch {
    return [];
  }
}

export function saveKb(nodes: LifelyKbNode[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KB_KEY, JSON.stringify(nodes));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function loadTab(): TabId {
  if (typeof localStorage === "undefined") return "calendar";
  try {
    const raw = localStorage.getItem(TAB_KEY);
    if (raw && TABS.includes(raw as TabId)) return raw as TabId;
  } catch {
    // ignore
  }
  return "calendar";
}

export function saveTab(tab: TabId): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(TAB_KEY, tab);
  } catch {
    // ignore
  }
}

export type Theme = "light" | "dark";

export function loadTheme(): Theme {
  if (typeof localStorage === "undefined") return "light";
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === "light" || raw === "dark") return raw;
  } catch {
    // ignore
  }
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function saveTheme(theme: Theme): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}

export function loadSidebarWidth(): number {
  if (typeof localStorage === "undefined") return SIDEBAR_WIDTH_DEFAULT;
  try {
    const raw = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    const parsed = raw == null ? NaN : Number(raw);
    return clampSidebarWidth(
      Number.isFinite(parsed) ? parsed : SIDEBAR_WIDTH_DEFAULT,
    );
  } catch {
    return SIDEBAR_WIDTH_DEFAULT;
  }
}

export function saveSidebarWidth(width: number): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(clampSidebarWidth(width)));
  } catch {
    // ignore
  }
}

export function loadPalette(): PaletteId {
  if (typeof localStorage === "undefined") return DEFAULT_PALETTE_ID;
  try {
    const raw = localStorage.getItem(PALETTE_KEY);
    if (isPaletteId(raw)) return raw;
  } catch {
    // ignore
  }
  return DEFAULT_PALETTE_ID;
}

export function savePalette(palette: PaletteId): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PALETTE_KEY, palette);
  } catch {
    // ignore
  }
}

export function applyTheme(theme: Theme, paletteId: PaletteId = loadPalette()): void {
  if (typeof document === "undefined") return;
  const palette = getPalette(paletteId);
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  applyPaletteVars(root, palette);
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? palette.navy : palette.mint);
  }
}

function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isPositiveAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isNonNegativeAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isSalary(value: unknown): value is FinanceSalary {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    isMonthKey(value.month) &&
    isNonNegativeAmount(value.amount) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isExpense(value: unknown): value is FinanceExpense {
  if (!isRecord(value)) return false;
  const rawCategory =
    typeof value.category === "string"
      ? (LEGACY_EXPENSE_CATEGORIES[value.category] ?? value.category)
      : null;
  if (
    !rawCategory ||
    !EXPENSE_CATEGORIES.includes(rawCategory as ExpenseCategory)
  ) {
    return false;
  }
  if (
    typeof value.id !== "string" ||
    !isPositiveAmount(value.amount) ||
    !isDateKey(value.date) ||
    typeof value.createdAt !== "string"
  ) {
    return false;
  }
  value.category = rawCategory;
  return true;
}

function isBonus(value: unknown): value is FinanceBonus {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    isPositiveAmount(value.amount) &&
    typeof value.bucket === "string" &&
    BUCKETS.includes(value.bucket as FinanceBucket) &&
    isDateKey(value.date) &&
    typeof value.createdAt === "string"
  );
}

function uniqueByMonth(salaries: FinanceSalary[]): FinanceSalary[] {
  const seen = new Map<string, FinanceSalary>();
  for (const salary of salaries) seen.set(salary.month, salary);
  return [...seen.values()];
}

export function loadFinances(): FinanceData {
  if (typeof localStorage === "undefined") return EMPTY_FINANCE_DATA;
  try {
    const raw = localStorage.getItem(FINANCES_KEY);
    if (!raw) return EMPTY_FINANCE_DATA;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return EMPTY_FINANCE_DATA;
    const salaries = Array.isArray(parsed.salaries)
      ? uniqueByMonth(parsed.salaries.filter(isSalary))
      : [];
    const expenses = Array.isArray(parsed.expenses)
      ? parsed.expenses.filter(isExpense)
      : [];
    const bonuses = Array.isArray(parsed.bonuses)
      ? parsed.bonuses.filter(isBonus)
      : [];
    const confirmedLogDates = Array.isArray(parsed.confirmedLogDates)
      ? parsed.confirmedLogDates.filter(
          (value): value is string => isDateKey(value),
        )
      : [];
    return {
      salaries,
      expenses,
      bonuses,
      confirmedLogDates: [...new Set(confirmedLogDates)],
      dismissedSalaryMonth: isMonthKey(parsed.dismissedSalaryMonth)
        ? parsed.dismissedSalaryMonth
        : null,
      dismissedExpenseDate: isDateKey(parsed.dismissedExpenseDate)
        ? parsed.dismissedExpenseDate
        : null,
      salaryNotifiedMonth: isMonthKey(parsed.salaryNotifiedMonth)
        ? parsed.salaryNotifiedMonth
        : null,
      expenseNotifiedDate: isDateKey(parsed.expenseNotifiedDate)
        ? parsed.expenseNotifiedDate
        : null,
    };
  } catch {
    return EMPTY_FINANCE_DATA;
  }
}

export function saveFinances(data: FinanceData): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(FINANCES_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota / private-mode failures.
  }
}
