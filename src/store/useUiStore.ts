import { loadTab, saveTab } from "@/lib/storage";
import { todayKey } from "@/lib/dates";
import type { TabId } from "@/types";
import { create } from "zustand";

export type ItemSheetState =
  | { mode: "new"; date: string }
  | { mode: "edit"; id: string };

export type ConfirmDelete =
  | { kind: "item"; id: string }
  | { kind: "note"; id: string }
  | { kind: "kb-page"; id: string }
  | { kind: "kb-folder"; id: string };

type UiState = {
  tab: TabId;
  setTab: (tab: TabId) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  daySheetOpen: boolean;
  openDay: (date: string) => void;
  closeDay: () => void;
  itemSheet: ItemSheetState | null;
  openNewItem: (date: string) => void;
  openEditItem: (id: string) => void;
  closeItemSheet: () => void;
  confirmDelete: ConfirmDelete | null;
  requestDelete: (id: string) => void;
  requestDeleteNote: (id: string) => void;
  requestDeleteKb: (kind: "kb-page" | "kb-folder", id: string) => void;
  closeConfirm: () => void;
  activeNoteId: string | null;
  openNote: (id: string) => void;
  closeNote: () => void;
  openLinkedNote: (id: string) => void;
  kbFolderId: string | null;
  kbPageId: string | null;
  openKbFolder: (id: string | null) => void;
  openKbPage: (id: string, folderId?: string | null) => void;
  closeKbPage: () => void;
  openLinkedKbPage: (id: string, folderId?: string | null) => void;
};

export const useUiStore = create<UiState>((set) => ({
  tab: loadTab(),
  setTab: (tab) => {
    saveTab(tab);
    set({ tab });
  },
  selectedDate: todayKey(),
  setSelectedDate: (date) => set({ selectedDate: date }),
  daySheetOpen: false,
  openDay: (date) => set({ selectedDate: date, daySheetOpen: true }),
  closeDay: () => set({ daySheetOpen: false }),
  itemSheet: null,
  openNewItem: (date) => set({ itemSheet: { mode: "new", date } }),
  openEditItem: (id) => set({ itemSheet: { mode: "edit", id } }),
  closeItemSheet: () => set({ itemSheet: null, confirmDelete: null }),
  confirmDelete: null,
  requestDelete: (id) => set({ confirmDelete: { kind: "item", id } }),
  requestDeleteNote: (id) => set({ confirmDelete: { kind: "note", id } }),
  requestDeleteKb: (kind, id) => set({ confirmDelete: { kind, id } }),
  closeConfirm: () => set({ confirmDelete: null }),
  activeNoteId: null,
  openNote: (id) => set({ activeNoteId: id }),
  closeNote: () => set({ activeNoteId: null }),
  openLinkedNote: (id) => {
    saveTab("notes");
    set({
      tab: "notes",
      activeNoteId: id,
      itemSheet: null,
      daySheetOpen: false,
      confirmDelete: null,
    });
  },
  kbFolderId: null,
  kbPageId: null,
  openKbFolder: (id) => set({ kbFolderId: id, kbPageId: null }),
  openKbPage: (id, folderId) =>
    set((state) => ({
      kbPageId: id,
      kbFolderId: folderId !== undefined ? folderId : state.kbFolderId,
    })),
  closeKbPage: () => set({ kbPageId: null }),
  openLinkedKbPage: (id, folderId) => {
    saveTab("knowledge");
    set({
      tab: "knowledge",
      kbPageId: id,
      kbFolderId: folderId ?? null,
      itemSheet: null,
      daySheetOpen: false,
      confirmDelete: null,
    });
  },
}));
