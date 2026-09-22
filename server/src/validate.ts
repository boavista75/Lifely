import { cleanHtml } from "./sanitize.js";

const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const BUCKETS = ["needs", "wants", "savings"] as const;
const SPEND = ["needs", "wants"] as const;

export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function id(value: unknown, label: string): string {
  if (typeof value !== "string" || !ID.test(value)) {
    throw new InputError(`${label} nije ispravan.`);
  }
  return value;
}

function optionalId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return id(value, "Veza");
}

function text(value: unknown, max: number, label: string): string {
  if (typeof value !== "string") throw new InputError(`${label} nije tekst.`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new InputError(`${label} je predugačak.`);
  return trimmed;
}

function rawText(value: unknown, max: number, label: string): string {
  if (typeof value !== "string") throw new InputError(`${label} nije tekst.`);
  if (value.length > max) throw new InputError(`${label} je predugačak.`);
  return value;
}

function stamp(value: unknown): string {
  if (typeof value !== "string" || value.length > 40 || Number.isNaN(Date.parse(value))) {
    throw new InputError("Datum zapisa nije ispravan.");
  }
  return value;
}

function clock(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || !TIME.test(value)) {
    throw new InputError("Vreme nije ispravno.");
  }
  return value;
}

function html(value: unknown): string {
  const source = rawText(value, 1_500_000, "Sadržaj");
  return cleanHtml(source);
}

function optionalHtml(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return html(value);
}

function scale(value: unknown): number {
  const number = typeof value === "number" ? value : 1;
  if (!Number.isFinite(number)) return 1;
  const stepped = Math.round(number / 0.1) * 0.1;
  return Math.min(1.6, Math.max(0.8, Number(stepped.toFixed(1))));
}

export type ItemRow = {
  id: string;
  title: string;
  date: string;
  timeMode: "none" | "start" | "range";
  startTime: string | null;
  endTime: string | null;
  completed: boolean;
  sport: boolean;
  noteId: string | null;
  kbPageId: string | null;
  createdAt: string;
  updatedAt: string;
};

export function parseItem(value: unknown): ItemRow {
  if (!isRecord(value)) throw new InputError("Stavka nije ispravna.");
  const timeMode = value.timeMode;
  if (timeMode !== "none" && timeMode !== "start" && timeMode !== "range") {
    throw new InputError("Vreme stavke nije ispravno.");
  }
  if (typeof value.date !== "string" || !DATE.test(value.date)) {
    throw new InputError("Datum stavke nije ispravan.");
  }
  const item: ItemRow = {
    id: id(value.id, "Stavka"),
    title: text(value.title, 500, "Naslov"),
    date: value.date,
    timeMode,
    startTime: timeMode === "none" ? null : clock(value.startTime),
    endTime: timeMode === "range" ? clock(value.endTime) : null,
    completed: value.completed === true,
    sport: value.sport === true,
    noteId: optionalId(value.noteId),
    kbPageId: optionalId(value.kbPageId),
    createdAt: stamp(value.createdAt),
    updatedAt: stamp(value.updatedAt),
  };
  return item;
}

export type NoteRow = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export function parseNote(value: unknown): NoteRow {
  if (!isRecord(value)) throw new InputError("Beleška nije ispravna.");
  return {
    id: id(value.id, "Beleška"),
    title: text(value.title, 500, "Naslov"),
    content: html(value.content),
    createdAt: stamp(value.createdAt),
    updatedAt: stamp(value.updatedAt),
  };
}

export type KbRow = {
  id: string;
  kind: "folder" | "page" | "file";
  parentId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  content?: string | null;
  textScale?: number;
  mediaId?: string;
  mimeType?: string;
  size?: number;
};

export function parseNode(value: unknown): KbRow {
  if (!isRecord(value)) throw new InputError("Knowledge stavka nije ispravna.");
  const kind = value.kind;
  if (kind !== "folder" && kind !== "page" && kind !== "file") {
    throw new InputError("Tip knowledge stavke nije ispravan.");
  }
  const base = {
    id: id(value.id, "Knowledge"),
    parentId: optionalId(value.parentId),
    title: text(value.title, 500, "Naslov"),
    createdAt: stamp(value.createdAt),
    updatedAt: stamp(value.updatedAt),
  };
  if (kind === "folder") return { ...base, kind };
  if (kind === "page") {
    return {
      ...base,
      kind,
      content: html(value.content),
      textScale: scale(value.textScale),
    };
  }
  let mime = typeof value.mimeType === "string" ? value.mimeType.trim().toLowerCase() : "";
  const separator = mime.indexOf(";");
  if (separator >= 0) mime = mime.slice(0, separator).trim();
  if (!mime) mime = "application/octet-stream";
  if (mime.length > 120 || !/^[\w.+-]+\/[\w.+-]+$/.test(mime)) {
    throw new InputError("Tip fajla nije ispravan.");
  }
  if (typeof value.size !== "number" || !Number.isFinite(value.size) || value.size < 0) {
    throw new InputError("Veličina fajla nije ispravna.");
  }
  const mediaId =
    value.mediaId === "" || value.mediaId == null
      ? ""
      : id(value.mediaId, "Fajl");
  return {
    ...base,
    kind,
    mediaId,
    mimeType: mime,
    size: Math.round(value.size),
    content: optionalHtml(value.content),
    textScale: scale(value.textScale),
  };
}

function amount(value: unknown, allowZero: boolean): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new InputError("Iznos nije ispravan.");
  }
  if (!allowZero && value <= 0) throw new InputError("Iznos nije ispravan.");
  if (value > 1_000_000_000) throw new InputError("Iznos je prevelik.");
  return value;
}

function list<T>(value: unknown, map: (entry: unknown) => T, max: number, label: string): T[] {
  if (!Array.isArray(value)) throw new InputError(`${label} nije lista.`);
  if (value.length > max) throw new InputError(`${label} ima previše stavki.`);
  return value.map(map);
}

export type FinanceRow = {
  salaries: unknown[];
  expenses: unknown[];
  bonuses: unknown[];
  savings: unknown[];
  categories: unknown[];
  splitEnabled: boolean;
  confirmedLogDates: string[];
  dismissedSalaryMonth: string | null;
  dismissedExpenseDate: string | null;
  salaryNotifiedMonth: string | null;
  expenseNotifiedDate: string | null;
};

export function parseFinances(value: unknown): FinanceRow {
  if (!isRecord(value)) throw new InputError("Finansije nisu ispravne.");
  const salaries = list(value.salaries, (entry) => {
    if (!isRecord(entry)) throw new InputError("Plata nije ispravna.");
    if (typeof entry.month !== "string" || !MONTH.test(entry.month)) {
      throw new InputError("Mesec plate nije ispravan.");
    }
    return {
      id: id(entry.id, "Plata"),
      month: entry.month,
      amount: amount(entry.amount, true),
      createdAt: stamp(entry.createdAt),
      updatedAt: stamp(entry.updatedAt),
    };
  }, 240, "Plate");
  const expenses = list(value.expenses, (entry) => {
    if (!isRecord(entry)) throw new InputError("Trošak nije ispravan.");
    if (typeof entry.date !== "string" || !DATE.test(entry.date)) {
      throw new InputError("Datum troška nije ispravan.");
    }
    return {
      id: id(entry.id, "Trošak"),
      category: text(entry.category, 80, "Kategorija"),
      amount: amount(entry.amount, false),
      date: entry.date,
      createdAt: stamp(entry.createdAt),
    };
  }, 20000, "Troškovi");
  const bonuses = list(value.bonuses, (entry) => {
    if (!isRecord(entry)) throw new InputError("Uplata nije ispravna.");
    if (typeof entry.bucket !== "string" || !BUCKETS.includes(entry.bucket as (typeof BUCKETS)[number])) {
      throw new InputError("Grupa uplate nije ispravna.");
    }
    if (typeof entry.date !== "string" || !DATE.test(entry.date)) {
      throw new InputError("Datum uplate nije ispravan.");
    }
    return {
      id: id(entry.id, "Uplata"),
      amount: amount(entry.amount, false),
      bucket: entry.bucket,
      date: entry.date,
      createdAt: stamp(entry.createdAt),
    };
  }, 5000, "Uplate");
  const savings = list(value.savings, (entry) => {
    if (!isRecord(entry)) throw new InputError("Ušteđevina nije ispravna.");
    if (typeof entry.month !== "string" || !MONTH.test(entry.month)) {
      throw new InputError("Mesec ušteđevine nije ispravan.");
    }
    return {
      id: id(entry.id, "Ušteđevina"),
      month: entry.month,
      amount: amount(entry.amount, false),
      createdAt: stamp(entry.createdAt),
      updatedAt: stamp(entry.updatedAt),
    };
  }, 240, "Ušteđevina");
  const categories = list(value.categories, (entry) => {
    if (!isRecord(entry)) throw new InputError("Kategorija nije ispravna.");
    if (
      typeof entry.bucket !== "string" ||
      !SPEND.includes(entry.bucket as (typeof SPEND)[number])
    ) {
      throw new InputError("Grupa kategorije nije ispravna.");
    }
    return {
      id: text(entry.id, 80, "Kategorija"),
      label: text(entry.label, 40, "Naziv kategorije"),
      bucket: entry.bucket,
    };
  }, 80, "Kategorije");
  const dates = Array.isArray(value.confirmedLogDates)
    ? value.confirmedLogDates.filter((entry): entry is string => typeof entry === "string" && DATE.test(entry))
    : [];
  if (dates.length > 2000) throw new InputError("Previše potvrda.");
  const monthOrNull = (entry: unknown): string | null => {
    if (entry === null || entry === undefined) return null;
    if (typeof entry !== "string" || !MONTH.test(entry)) {
      throw new InputError("Mesec nije ispravan.");
    }
    return entry;
  };
  const dateOrNull = (entry: unknown): string | null => {
    if (entry === null || entry === undefined) return null;
    if (typeof entry !== "string" || !DATE.test(entry)) {
      throw new InputError("Datum nije ispravan.");
    }
    return entry;
  };
  return {
    salaries: uniqueMonth(salaries),
    expenses,
    bonuses,
    savings: uniqueMonth(savings),
    categories,
    splitEnabled: value.splitEnabled !== false,
    confirmedLogDates: [...new Set(dates)],
    dismissedSalaryMonth: monthOrNull(value.dismissedSalaryMonth),
    dismissedExpenseDate: dateOrNull(value.dismissedExpenseDate),
    salaryNotifiedMonth: monthOrNull(value.salaryNotifiedMonth),
    expenseNotifiedDate: dateOrNull(value.expenseNotifiedDate),
  };
}

function uniqueMonth<T extends { month: string }>(entries: T[]): T[] {
  const seen = new Map<string, T>();
  for (const entry of entries) seen.set(entry.month, entry);
  return [...seen.values()];
}

export function parseIdList(value: unknown): string[] {
  if (!Array.isArray(value)) throw new InputError("Lista za brisanje nije ispravna.");
  if (value.length > 5000) throw new InputError("Previše brisanja odjednom.");
  return value.map((entry) => id(entry, "Zapis"));
}

export function mimeAllowed(mime: string): boolean {
  if (mime.length > 120 || !/^[\w.+-]+\/[\w.+-]+$/.test(mime)) return false;
  const blocked = new Set([
    "image/svg+xml",
    "text/html",
    "application/xhtml+xml",
    "text/javascript",
    "application/javascript",
    "application/x-javascript",
  ]);
  return !blocked.has(mime.toLowerCase());
}
