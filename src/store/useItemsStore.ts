import { loadItems, saveItems } from "@/lib/storage";
import type { ItemDraft, LifelyItem } from "@/types";
import { create } from "zustand";

type ItemsState = {
  items: LifelyItem[];
  addItem: (draft: ItemDraft) => LifelyItem;
  updateItem: (id: string, patch: Partial<ItemDraft>) => void;
  toggleComplete: (id: string) => void;
  deleteItem: (id: string) => void;
  unlinkNote: (noteId: string) => void;
  unlinkKbPages: (pageIds: string[]) => void;
};

function persist(items: LifelyItem[]): LifelyItem[] {
  saveItems(items);
  return items;
}

export const useItemsStore = create<ItemsState>((set, get) => ({
  items: loadItems(),

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
}));
