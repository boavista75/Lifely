import { noteCreatedTitle } from "@/lib/dates";
import { displayNoteTitle, notePreview } from "@/lib/notes";
import type {
  LifelyKbFile,
  LifelyKbFolder,
  LifelyKbNode,
  LifelyKbPage,
} from "@/types";

export const KB_LINK_PREFIX = "kb://";

export function kbHref(pageId: string): string {
  return `${KB_LINK_PREFIX}${pageId}`;
}

export function pageIdFromHref(href: string | undefined | null): string | null {
  if (!href?.startsWith(KB_LINK_PREFIX)) return null;
  const id = href.slice(KB_LINK_PREFIX.length);
  return id.length > 0 ? id : null;
}

export function displayKbTitle(title: string, createdAt?: string): string {
  return displayNoteTitle(title, createdAt);
}

export function isKbPage(node: LifelyKbNode): node is LifelyKbPage {
  return node.kind === "page";
}

export function isKbFolder(node: LifelyKbNode): node is LifelyKbFolder {
  return node.kind === "folder";
}

export function isKbFile(node: LifelyKbNode): node is LifelyKbFile {
  return node.kind === "file";
}

const KIND_ORDER: Record<LifelyKbNode["kind"], number> = {
  folder: 0,
  file: 1,
  page: 2,
};

export function childrenOf(
  nodes: LifelyKbNode[],
  parentId: string | null,
): LifelyKbNode[] {
  return nodes
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => {
      const rank = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
      if (rank !== 0) return rank;
      return a.title.localeCompare(b.title, "sr-Latn");
    });
}

export function folderPath(
  nodes: LifelyKbNode[],
  folderId: string | null,
): LifelyKbFolder[] {
  const path: LifelyKbFolder[] = [];
  let current = folderId;
  const seen = new Set<string>();
  while (current && !seen.has(current)) {
    seen.add(current);
    const node = nodes.find(
      (entry) => entry.id === current && entry.kind === "folder",
    );
    if (!node || node.kind !== "folder") break;
    path.unshift(node);
    current = node.parentId;
  }
  return path;
}

export function kbFolderPathLabel(
  nodes: LifelyKbNode[],
  parentId: string | null,
): string {
  return folderPath(nodes, parentId)
    .map((folder) => displayKbTitle(folder.title))
    .join(" / ");
}

export function descendantIds(
  nodes: LifelyKbNode[],
  folderId: string,
): string[] {
  const ids = [folderId];
  for (const child of nodes.filter((node) => node.parentId === folderId)) {
    if (child.kind === "folder") ids.push(...descendantIds(nodes, child.id));
    else ids.push(child.id);
  }
  return ids;
}

export function canMoveKbNode(
  nodes: LifelyKbNode[],
  nodeId: string,
  parentId: string | null,
): boolean {
  const node = nodes.find((entry) => entry.id === nodeId);
  if (!node) return false;
  if (node.parentId === parentId) return false;
  if (parentId === null) return true;
  if (parentId === nodeId) return false;
  const parent = nodes.find((entry) => entry.id === parentId);
  if (!parent || parent.kind !== "folder") return false;
  if (node.kind === "folder") {
    return !descendantIds(nodes, node.id).includes(parentId);
  }
  return true;
}

export function applyKbMove(
  nodes: LifelyKbNode[],
  nodeId: string,
  parentId: string | null,
): LifelyKbNode[] | null {
  if (!canMoveKbNode(nodes, nodeId, parentId)) return null;
  const node = nodes.find((entry) => entry.id === nodeId);
  if (!node) return null;
  const now = new Date().toISOString();
  const title =
    node.kind === "folder"
      ? uniqueFolderTitle(nodes, parentId, node.title.trim() || "Novi folder")
      : uniqueSiblingTitle(nodes, parentId, node.title);
  return nodes.map((entry) =>
    entry.id === nodeId
      ? { ...entry, parentId, title, updatedAt: now }
      : entry,
  );
}

export function kbMoveFolderOptions(
  nodes: LifelyKbNode[],
  nodeId: string,
): { id: string; title: string; depth: number; current: boolean }[] {
  const node = nodes.find((entry) => entry.id === nodeId);
  if (!node) return [];
  const currentParentId = node.parentId;
  const blocked =
    node.kind === "folder"
      ? new Set(descendantIds(nodes, node.id))
      : new Set<string>();
  const options: {
    id: string;
    title: string;
    depth: number;
    current: boolean;
  }[] = [];

  function walk(parentId: string | null, depth: number) {
    for (const child of childrenOf(nodes, parentId)) {
      if (!isKbFolder(child) || blocked.has(child.id)) continue;
      options.push({
        id: child.id,
        title: displayKbTitle(child.title),
        depth,
        current: currentParentId === child.id,
      });
      walk(child.id, depth + 1);
    }
  }

  walk(null, 0);
  return options;
}

export function uniqueFolderTitle(
  nodes: LifelyKbNode[],
  parentId: string | null,
  base = "Novi folder",
): string {
  const used = new Set(
    nodes
      .filter((node) => node.parentId === parentId && node.kind === "folder")
      .map((node) => node.title),
  );
  if (!used.has(base)) return base;
  let index = 2;
  while (used.has(`${base} ${index}`)) index += 1;
  return `${base} ${index}`;
}

export function uniqueSiblingTitle(
  nodes: LifelyKbNode[],
  parentId: string | null,
  base: string,
): string {
  const used = new Set(
    nodes
      .filter((node) => node.parentId === parentId)
      .map((node) => node.title),
  );
  if (!used.has(base)) return base;
  let index = 2;
  while (used.has(`${base} ${index}`)) index += 1;
  return `${base} ${index}`;
}

export function searchKbPages(
  nodes: LifelyKbNode[],
  query: string,
): LifelyKbPage[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return nodes.filter(isKbPage).filter((page) => {
    const title = displayKbTitle(page.title, page.createdAt).toLowerCase();
    const body = notePreview(page.content).toLowerCase();
    return title.includes(needle) || body.includes(needle);
  });
}

export function searchKbFiles(
  nodes: LifelyKbNode[],
  query: string,
): LifelyKbFile[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return nodes.filter(isKbFile).filter((file) => {
    if (file.title.toLowerCase().includes(needle)) return true;
    if (!file.content) return false;
    return notePreview(file.content).toLowerCase().includes(needle);
  });
}

export function defaultPageTitle(created: Date = new Date()): string {
  return noteCreatedTitle(created);
}

export const KB_TEXT_SCALE_DEFAULT = 1;
export const KB_TEXT_SCALE_MIN = 0.8;
export const KB_TEXT_SCALE_MAX = 1.6;
export const KB_TEXT_SCALE_STEP = 0.1;

export function clampKbTextScale(value: number): number {
  const stepped =
    Math.round(value / KB_TEXT_SCALE_STEP) * KB_TEXT_SCALE_STEP;
  return Math.min(
    KB_TEXT_SCALE_MAX,
    Math.max(KB_TEXT_SCALE_MIN, Number(stepped.toFixed(1))),
  );
}
