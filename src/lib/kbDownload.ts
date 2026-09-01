import {
  childrenOf,
  displayKbTitle,
  isKbFile,
  isKbFolder,
  isKbPage,
} from "@/lib/kb";
import { fileExtension, isEditorKbFileName } from "@/lib/kbFiles";
import {
  htmlToMarkdown,
  htmlToPlainText,
} from "@/lib/kbFilePreview";
import { htmlContentToPdf } from "@/lib/kbHtmlPdf";
import { loadMedia, loadMediaMany } from "@/lib/media";
import { pdfBytesToBlob } from "@/lib/kbPdf";
import { buildZipStore } from "@/lib/zip";
import type { LifelyKbFile, LifelyKbNode, LifelyKbPage } from "@/types";

export function safeDownloadName(name: string, fallback: string): string {
  const forbidden = '<>:"/\\|?*';
  const cleaned = Array.from(name.normalize("NFC"), (char) => {
    const code = char.codePointAt(0) ?? 0;
    if (code < 32 || forbidden.includes(char)) return " ";
    return char;
  })
    .join("")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .trim();
  if (!cleaned || cleaned === "." || cleaned === "..") return fallback;
  return cleaned.slice(0, 180);
}

function uniqueZipPath(used: Set<string>, path: string): string {
  if (!used.has(path.toLowerCase())) {
    used.add(path.toLowerCase());
    return path;
  }
  const slash = path.lastIndexOf("/");
  const dir = slash === -1 ? "" : path.slice(0, slash + 1);
  const base = slash === -1 ? path : path.slice(slash + 1);
  const dirName = base.endsWith("/");
  const body = dirName ? base.slice(0, -1) : base;
  const dot = body.lastIndexOf(".");
  const stem = !dirName && dot > 0 ? body.slice(0, dot) : body;
  const ext = !dirName && dot > 0 ? body.slice(dot) : "";
  let index = 2;
  let next = `${dir}${stem} ${index}${ext}${dirName ? "/" : ""}`;
  while (used.has(next.toLowerCase())) {
    index += 1;
    next = `${dir}${stem} ${index}${ext}${dirName ? "/" : ""}`;
  }
  used.add(next.toLowerCase());
  return next;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
}

async function bytesFromBlob(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

function mediaIdsInHtml(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return [...doc.querySelectorAll("[data-media-id]")]
    .map((element) => element.getAttribute("data-media-id") ?? "")
    .filter(Boolean);
}

async function pagePayload(
  page: LifelyKbPage,
  media: Map<string, Blob>,
): Promise<{ name: string; bytes: Uint8Array; type: string }> {
  const title = displayKbTitle(page.title, page.createdAt);
  const bytes = await htmlContentToPdf(title, page.content, {
    textScale: page.textScale,
    media,
  });
  return {
    name: `${safeDownloadName(title, "stranica")}.pdf`,
    bytes,
    type: "application/pdf",
  };
}

async function uploadedFilePayload(
  file: LifelyKbFile,
  media: Map<string, Blob>,
): Promise<{ name: string; bytes: Uint8Array; type: string } | null> {
  if (file.mediaId) {
    const blob = media.get(file.mediaId) ?? (await loadMedia(file.mediaId));
    if (blob) {
      return {
        name: safeDownloadName(file.title, "fajl"),
        bytes: await bytesFromBlob(blob),
        type: file.mimeType || blob.type || "application/octet-stream",
      };
    }
  }
  if (isEditorKbFileName(file.title) && typeof file.content === "string") {
    const ext = fileExtension(file.title);
    const text =
      ext === "md" ? htmlToMarkdown(file.content) : htmlToPlainText(file.content);
    return {
      name: safeDownloadName(file.title, `fajl.${ext}`),
      bytes: new TextEncoder().encode(text),
      type: ext === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8",
    };
  }
  return null;
}

function collectMediaIds(nodes: LifelyKbNode[], folderId: string): string[] {
  const ids: string[] = [];
  const stack = [folderId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    for (const child of nodes) {
      if (child.parentId !== current) continue;
      if (isKbFolder(child)) stack.push(child.id);
      else if (isKbFile(child) && child.mediaId) ids.push(child.mediaId);
      else if (isKbPage(child)) ids.push(...mediaIdsInHtml(child.content));
    }
  }
  return ids;
}

async function zipFolder(
  nodes: LifelyKbNode[],
  folderId: string,
): Promise<{ blob: Blob; name: string }> {
  const folder = nodes.find((node) => node.id === folderId && isKbFolder(node));
  if (!folder) throw new Error("Folder nije pronađen");
  const rootName = safeDownloadName(folder.title, "folder");
  const media = await loadMediaMany(collectMediaIds(nodes, folderId));
  const used = new Set<string>([rootName.toLowerCase()]);
  const entries: { path: string; data: Uint8Array }[] = [];
  const empty = new Uint8Array();

  async function walk(parentId: string, prefix: string) {
    entries.push({ path: `${prefix}/`, data: empty });
    for (const child of childrenOf(nodes, parentId)) {
      if (isKbFolder(child)) {
        const next = uniqueZipPath(
          used,
          `${prefix}/${safeDownloadName(child.title, "folder")}`,
        );
        await walk(child.id, next);
        continue;
      }
      if (isKbFile(child)) {
        const payload = await uploadedFilePayload(child, media);
        if (!payload) continue;
        entries.push({
          path: uniqueZipPath(used, `${prefix}/${payload.name}`),
          data: payload.bytes,
        });
        continue;
      }
      if (isKbPage(child)) {
        const payload = await pagePayload(child, media);
        entries.push({
          path: uniqueZipPath(used, `${prefix}/${payload.name}`),
          data: payload.bytes,
        });
      }
    }
  }

  await walk(folder.id, rootName);
  return {
    blob: buildZipStore(entries),
    name: `${rootName}.zip`,
  };
}

export async function downloadKbNode(
  nodes: LifelyKbNode[],
  id: string,
): Promise<void> {
  const node = nodes.find((entry) => entry.id === id);
  if (!node) throw new Error("Stavka nije pronađena");
  if (isKbFolder(node)) {
    const zip = await zipFolder(nodes, node.id);
    triggerDownload(zip.blob, zip.name);
    return;
  }
  if (isKbPage(node)) {
    const media = await loadMediaMany(mediaIdsInHtml(node.content));
    const payload = await pagePayload(node, media);
    triggerDownload(pdfBytesToBlob(payload.bytes), payload.name);
    return;
  }
  if (!isKbFile(node)) throw new Error("Preuzimanje nije dostupno");
  const media = node.mediaId
    ? await loadMediaMany([node.mediaId])
    : new Map<string, Blob>();
  const payload = await uploadedFilePayload(node, media);
  if (!payload) throw new Error("Fajl nije pronađen");
  triggerDownload(
    new Blob([Uint8Array.from(payload.bytes).buffer], { type: payload.type }),
    payload.name,
  );
}
