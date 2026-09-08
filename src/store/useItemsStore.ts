import { mergeAlpineSeasonItems } from "@/lib/alpineSeasonSeed";
import { mergeFreestyleSeasonItems } from "@/lib/freestyleSeasonSeed";
import { mergeNbaSeasonItems } from "@/lib/nbaSeasonSeed";
import { loadItems, saveItems } from "@/lib/storage";
import type { ItemDraft, LifelyItem } from "@/types";
import { create } from "zustand";

type ItemsState = {
  items: LifelyItem[];
  hydrate: () => void;
  addItem: (draft: ItemDraft) => LifelyItem;
  updateItem: (id: string, patch: Partial<ItemDraft>) => void;
  toggleComplete: (id: string) => void;
  deleteItem: (id: string) => void;
  unlinkNote: (noteId: string) => void;
  unlinkKbPages: (pageIds: string[]) => void;
  ensureAlpineSeason: () => void;
  ensureFreestyleSeason: () => void;
  ensureNbaSeason: () => void;
};

function persist(items: LifelyItem[]): LifelyItem[] {
  saveItems(items);
  return items;
}

export const useItemsStore = create<ItemsState>((set, get) => ({
  items: [],

  hydrate: () => set({ items: loadItems() }),

  addItem: (draft) => {
    const now = new Date().toISOString();
    const item: LifelyItem = {
      id: crypto.randomUUID(),
      title: draft.title.trim(),
      date: draft.date,
      timeMode: draft.timeMode,
      startTime: draft.timeMode === "none" ? null : draft.startTime,
      endTime: draft.timeMode === "range" ? draft.endTime : null,
      completed: draft.completed ?? false,
      noteId: draft.noteId ?? null,
      kbPageId: draft.kbPageId ?? null,
      sport: draft.sport ?? false,
      createdAt: now,
      updatedAt: now,
    };
    set({ items: persist([...get().items, item]) });
    return item;
  },

  updateItem: (id, patch) => {
    const now = new Date().toISOString();
    set({
      items: persist(
        get().items.map((item) => {
          if (item.id !== id) return item;
          const next = { ...item, ...patch, updatedAt: now };
          if (next.timeMode === "none") {
            next.startTime = null;
            next.endTime = null;
          } else if (next.timeMode === "start") {
            next.endTime = null;
          }
          next.title = next.title.trim();
          return next;
        }),
      ),
    });
  },

  toggleComplete: (id) => {
    const now = new Date().toISOString();
    set({
      items: persist(
        get().items.map((item) =>
          item.id === id
            ? { ...item, completed: !item.completed, updatedAt: now }
            : item,
        ),
      ),
    });
  },

  deleteItem: (id) => {
    set({ items: persist(get().items.filter((item) => item.id !== id)) });
  },

  unlinkNote: (noteId) => {
    const now = new Date().toISOString();
    set({
      items: persist(
        get().items.map((item) =>
          item.noteId === noteId
            ? { ...item, noteId: null, updatedAt: now }
            : item,
        ),
      ),
    });
  },

  unlinkKbPages: (pageIds) => {
    if (pageIds.length === 0) return;
    const drop = new Set(pageIds);
    const now = new Date().toISOString();
    set({
      items: persist(
        get().items.map((item) =>
          item.kbPageId && drop.has(item.kbPageId)
            ? { ...item, kbPageId: null, updatedAt: now }
            : item,
        ),
      ),
    });
  },

  ensureAlpineSeason: () => {
    const { items, added } = mergeAlpineSeasonItems(get().items);
    if (added === 0) return;
    set({ items: persist(items) });
  },

  ensureFreestyleSeason: () => {
    const { items, added } = mergeFreestyleSeasonItems(get().items);
    if (added === 0) return;
    set({ items: persist(items) });
  },

  ensureNbaSeason: () => {
    const { items, added, removed } = mergeNbaSeasonItems(get().items);
    if (added === 0 && removed === 0) return;
    set({ items: persist(items) });
  },
}));
