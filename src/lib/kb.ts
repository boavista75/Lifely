import { noteCreatedTitle } from "@/lib/dates";
import { displayNoteTitle, notePreview } from "@/lib/notes";
import type { LifelyKbFolder, LifelyKbNode, LifelyKbPage } from "@/types";

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

export function childrenOf(
  nodes: LifelyKbNode[],
  parentId: string | null,
): LifelyKbNode[] {
  return nodes
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
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

export function defaultPageTitle(created: Date = new Date()): string {
  return noteCreatedTitle(created);
}
