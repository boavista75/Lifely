import { noteCreatedTitle } from "@/lib/dates";
import { loadNotes, saveNotes } from "@/lib/storage";
import { useItemsStore } from "@/store/useItemsStore";
import type { LifelyNote } from "@/types";
import { create } from "zustand";

type NotesState = {
  notes: LifelyNote[];
  addNote: () => LifelyNote;
  updateNote: (id: string, patch: Partial<Pick<LifelyNote, "title" | "content">>) => void;
  deleteNote: (id: string) => void;
};

function persist(notes: LifelyNote[]): LifelyNote[] {
  saveNotes(notes);
  return notes;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: loadNotes(),

  addNote: () => {
    const created = new Date();
    const now = created.toISOString();
    const note: LifelyNote = {
      id: crypto.randomUUID(),
      title: noteCreatedTitle(created),
      content: "",
      createdAt: now,
      updatedAt: now,
    };
    set({ notes: persist([note, ...get().notes]) });
    return note;
  },

  updateNote: (id, patch) => {
    const now = new Date().toISOString();
    set({
      notes: persist(
        get().notes.map((note) =>
          note.id === id ? { ...note, ...patch, updatedAt: now } : note,
        ),
      ),
    });
  },

  deleteNote: (id) => {
    set({ notes: persist(get().notes.filter((note) => note.id !== id)) });
    useItemsStore.getState().unlinkNote(id);
  },
}));
