import {
  applyKbMove,
  defaultPageTitle,
  descendantIds,
  isKbFile,
  KB_TEXT_SCALE_DEFAULT,
  uniqueFolderTitle,
} from "@/lib/kb";
import { convertDocumentToHtml } from "@/lib/kbFilePreview";
import { isEditorKbFileName, planKbImport } from "@/lib/kbFiles";
import { deleteMedia, loadMedia, saveMediaMany } from "@/lib/media";
import { loadKb, saveKb } from "@/lib/storage";
import { useItemsStore } from "@/store/useItemsStore";
import type { LifelyKbFolder, LifelyKbNode, LifelyKbPage } from "@/types";
import { create } from "zustand";

type KbState = {
  nodes: LifelyKbNode[];
  addFolder: (parentId: string | null) => LifelyKbFolder;
  addPage: (parentId: string | null) => LifelyKbPage;
  importFiles: (
    parentId: string | null,
    files: File[],
  ) => Promise<{
    expandIds: string[];
    skippedLarge: string[];
    imported: number;
  }>;
  hydrateEditableFile: (id: string) => Promise<void>;
  updateNode: (
    id: string,
    patch: Partial<
      Pick<LifelyKbPage, "title" | "textScale"> & {
        content?: string | null;
        size?: number;
      }
    >,
  ) => void;
  deleteNode: (id: string) => string[];
  moveNode: (id: string, parentId: string | null) => boolean;
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
      textScale: KB_TEXT_SCALE_DEFAULT,
      createdAt: now,
      updatedAt: now,
    };
    set({ nodes: persist([page, ...get().nodes]) });
    return page;
  },

  importFiles: async (parentId, files) => {
    const plan = await planKbImport(get().nodes, parentId, files);
    if (plan.blobs.length > 0) {
      await saveMediaMany(plan.blobs);
    }
    if (plan.nodes.length > 0) {
      set({ nodes: persist([...plan.nodes, ...get().nodes]) });
    }
    return {
      expandIds: plan.expandIds,
      skippedLarge: plan.skippedLarge,
      imported: plan.nodes.filter((node) => node.kind !== "folder").length,
    };
  },

  hydrateEditableFile: async (id) => {
    const node = get().nodes.find((entry) => entry.id === id);
    if (!node || !isKbFile(node) || node.content !== null) return;
    if (!isEditorKbFileName(node.title) || !node.mediaId) return;
    const blob = await loadMedia(node.mediaId);
    const content = blob
      ? await convertDocumentToHtml(blob, node.title)
      : "<p></p>";
    get().updateNode(id, { content });
  },

  updateNode: (id, patch) => {
    const now = new Date().toISOString();
    set({
      nodes: persist(
        get().nodes.map((node) => {
          if (node.id !== id) return node;
          if (node.kind === "folder") {
            return {
              ...node,
              title: patch.title ?? node.title,
              updatedAt: now,
            };
          }
          if (node.kind === "file") {
            return { ...node, ...patch, updatedAt: now };
          }
          return {
            ...node,
            title: patch.title ?? node.title,
            textScale: patch.textScale ?? node.textScale,
            content:
              typeof patch.content === "string" ? patch.content : node.content,
            updatedAt: now,
          };
        }),
      ),
    });
  },

  deleteNode: (id) => {
    const target = get().nodes.find((node) => node.id === id);
    const removed =
      target?.kind === "folder" ? descendantIds(get().nodes, id) : [id];
    const drop = new Set(removed);
    const mediaIds = get()
      .nodes.filter(isKbFile)
      .filter((node) => drop.has(node.id))
      .map((node) => node.mediaId);
    set({
      nodes: persist(get().nodes.filter((node) => !drop.has(node.id))),
    });
    useItemsStore.getState().unlinkKbPages(removed);
    void deleteMedia(mediaIds);
    return removed;
  },

  moveNode: (id, parentId) => {
    const next = applyKbMove(get().nodes, id, parentId);
    if (!next) return false;
    set({ nodes: persist(next) });
    return true;
  },
}));
