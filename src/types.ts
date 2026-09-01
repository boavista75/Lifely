export type TimeMode = "none" | "start" | "range";

export type TabId =
  | "calendar"
  | "todo"
  | "notes"
  | "knowledge"
  | "finances";

export interface LifelyItem {
  id: string;
  title: string;
  date: string;
  timeMode: TimeMode;
  startTime: string | null;
  endTime: string | null;
  completed: boolean;
  noteId: string | null;
  kbPageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ItemDraft = {
  title: string;
  date: string;
  timeMode: TimeMode;
  startTime: string | null;
  endTime: string | null;
  completed?: boolean;
  noteId?: string | null;
  kbPageId?: string | null;
};

export interface LifelyNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface LifelyKbFolder {
  id: string;
  kind: "folder";
  parentId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface LifelyKbPage {
  id: string;
  kind: "page";
  parentId: string | null;
  title: string;
  content: string;
  textScale: number;
  createdAt: string;
  updatedAt: string;
}

export interface LifelyKbFile {
  id: string;
  kind: "file";
  parentId: string | null;
  title: string;
  mediaId: string;
  mimeType: string;
  size: number;
  content: string | null;
  textScale: number;
  createdAt: string;
  updatedAt: string;
}

export type LifelyKbNode = LifelyKbFolder | LifelyKbPage | LifelyKbFile;

export type FinanceBucket = "needs" | "wants" | "savings";

export type ExpenseCategory =
  | "stanarina"
  | "gorivo"
  | "racuni"
  | "nabavka"
  | "kafic"
  | "brza-hrana"
  | "bioskop"
  | "subskripcije"
  | "soping";

export interface FinanceSalary {
  id: string;
  month: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceExpense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  createdAt: string;
}

export interface FinanceBonus {
  id: string;
  amount: number;
  bucket: FinanceBucket;
  date: string;
  createdAt: string;
}

export interface FinanceData {
  salaries: FinanceSalary[];
  expenses: FinanceExpense[];
  bonuses: FinanceBonus[];
  confirmedLogDates: string[];
  dismissedSalaryMonth: string | null;
  dismissedExpenseDate: string | null;
  salaryNotifiedMonth: string | null;
  expenseNotifiedDate: string | null;
}
