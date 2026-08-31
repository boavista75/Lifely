import { create } from "zustand";

type KbExplorerState = {
  query: string;
  setQuery: (query: string) => void;
  expanded: string[];
  createParentId: string | null;
  setCreateParentId: (id: string | null) => void;
  expandFolders: (ids: string[]) => void;
  collapseFolders: (ids: Set<string>) => void;
};

export const useKbExplorerStore = create<KbExplorerState>((set) => ({
  query: "",
  setQuery: (query) => set({ query }),
  expanded: [],
  createParentId: null,
  setCreateParentId: (id) => set({ createParentId: id }),
  expandFolders: (ids) =>
    set((state) => {
      const next = [...new Set([...state.expanded, ...ids])];
      if (
        next.length === state.expanded.length &&
        ids.every((id) => state.expanded.includes(id))
      ) {
        return state;
      }
      return { expanded: next };
    }),
  collapseFolders: (ids) =>
    set((state) => ({
      expanded: state.expanded.filter((id) => !ids.has(id)),
      createParentId:
        state.createParentId && ids.has(state.createParentId)
          ? null
          : state.createParentId,
    })),
}));
