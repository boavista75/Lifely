import { clampKbTextScale, KB_TEXT_SCALE_DEFAULT, isKbFile, isKbPage } from "@/lib/kb";
import type { LifelyItem, LifelyKbNode, LifelyNote, TabId } from "@/types";

const ITEMS_KEY = "lifely-items";
const NOTES_KEY = "lifely-notes";
const KB_KEY = "lifely-kb";
const TAB_KEY = "lifely-tab";
const THEME_KEY = "lifely-theme";

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

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#011638" : "#DFF8EB");
  }
}
