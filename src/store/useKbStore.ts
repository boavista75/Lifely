import { defaultPageTitle, descendantIds, uniqueFolderTitle } from "@/lib/kb";
import { loadKb, saveKb } from "@/lib/storage";
import { useItemsStore } from "@/store/useItemsStore";
import type { LifelyKbFolder, LifelyKbNode, LifelyKbPage } from "@/types";
import { create } from "zustand";

type KbState = {
  nodes: LifelyKbNode[];
  addFolder: (parentId: string | null) => LifelyKbFolder;
  addPage: (parentId: string | null) => LifelyKbPage;
  updateNode: (
    id: string,
    patch: Partial<Pick<LifelyKbPage, "title" | "content">>,
  ) => void;
  deleteNode: (id: string) => string[];
};

function persist(nodes: LifelyKbNode[]): LifelyKbNode[] {
  saveKb(nodes);
  return nodes;
}

export const useKbStore = create<KbState>((set, get) => ({
  nodes: loadKb(),

  addFolder: (parentId) => {
    const created = new Date();
    const now = created.toISOString();
    const folder: LifelyKbFolder = {
      id: crypto.randomUUID(),
      kind: "folder",
      parentId,
      title: uniqueFolderTitle(get().nodes, parentId),
      createdAt: now,
      updatedAt: now,
    };
    set({ nodes: persist([folder, ...get().nodes]) });
    return folder;
  },

  addPage: (parentId) => {
    const created = new Date();
    const now = created.toISOString();
    const page: LifelyKbPage = {
      id: crypto.randomUUID(),
      kind: "page",
      parentId,
      title: defaultPageTitle(created),
      content: "",
      createdAt: now,
      updatedAt: now,
    };
    set({ nodes: persist([page, ...get().nodes]) });
    return page;
  },

  updateNode: (id, patch) => {
    const now = new Date().toISOString();
    set({
      nodes: persist(
        get().nodes.map((node) =>
          node.id === id ? { ...node, ...patch, updatedAt: now } : node,
        ),
      ),
    });
  },

  deleteNode: (id) => {
    const target = get().nodes.find((node) => node.id === id);
    const removed =
      target?.kind === "folder" ? descendantIds(get().nodes, id) : [id];
    const drop = new Set(removed);
    set({
      nodes: persist(get().nodes.filter((node) => !drop.has(node.id))),
    });
    useItemsStore.getState().unlinkKbPages(removed);
    return removed;
  },
}));
