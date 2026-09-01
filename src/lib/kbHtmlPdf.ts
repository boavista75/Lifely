import { loadKbPdfFont } from "@/lib/kbPdf";
import { loadMedia } from "@/lib/media";
import type { PDFFont, PDFImage, PDFPage } from "pdf-lib";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 54;

type Run = { text: string; bold?: boolean };
type Block =
  | { kind: "heading"; level: 1 | 2 | 3; runs: Run[] }
  | { kind: "paragraph"; runs: Run[] }
  | { kind: "quote"; runs: Run[] }
  | { kind: "code"; text: string }
  | {
      kind: "item";
      marker: string;
      runs: Run[];
      depth: number;
    }
  | { kind: "image"; mediaId: string; widthPct: number }
  | { kind: "video" };

function inlineRuns(node: Node): Run[] {
  const runs: Run[] = [];
  function walk(current: Node, bold: boolean) {
    if (current.nodeType === Node.TEXT_NODE) {
      const text = (current.textContent ?? "").replace(/\u00a0/g, " ");
      if (text) runs.push({ text, bold });
      return;
    }
    if (!(current instanceof Element)) return;
    const tag = current.tagName.toLowerCase();
    if (tag === "br") {
      runs.push({ text: "\n", bold });
      return;
    }
    if (tag === "ul" || tag === "ol") return;
    const nextBold = bold || tag === "strong" || tag === "b";
    for (const child of current.childNodes) walk(child, nextBold);
  }
  walk(node, false);
  return runs;
}

function collectBlocks(root: Element, depth = 0): Block[] {
  const blocks: Block[] = [];
  for (const node of [...root.childNodes]) {
    if (!(node instanceof Element)) {
      const text = (node.textContent ?? "").replace(/\u00a0/g, " ").trim();
      if (text) blocks.push({ kind: "paragraph", runs: [{ text }] });
      continue;
    }
    const tag = node.tagName.toLowerCase();
    if (tag === "h1" || tag === "h2" || tag === "h3") {
      blocks.push({
        kind: "heading",
        level: Number(tag[1]) as 1 | 2 | 3,
        runs: inlineRuns(node),
      });
      continue;
    }
    if (tag === "img") {
      const mediaId = node.getAttribute("data-media-id");
      if (mediaId) {
        const width = Number(node.getAttribute("data-width") ?? 100);
        blocks.push({
          kind: "image",
          mediaId,
          widthPct: Number.isFinite(width) ? width : 100,
        });
      }
      continue;
    }
    if (tag === "video") {
      blocks.push({ kind: "video" });
      continue;
    }
    if (tag === "blockquote") {
      blocks.push({ kind: "quote", runs: inlineRuns(node) });
      continue;
    }
    if (tag === "pre") {
      blocks.push({ kind: "code", text: (node.textContent ?? "").trimEnd() });
      continue;
    }
    if (tag === "ul" || tag === "ol") {
      blocks.push(...collectList(node, depth));
      continue;
    }
    if (tag === "hr") continue;
    if (tag === "p") {
      blocks.push({ kind: "paragraph", runs: inlineRuns(node) });
      continue;
    }
    blocks.push(...collectBlocks(node, depth));
  }
  return blocks;
}

function collectList(list: Element, depth: number): Block[] {
  const ordered = list.tagName.toLowerCase() === "ol";
  const task = list.getAttribute("data-type") === "taskList";
  const blocks: Block[] = [];
  let index = 1;
  for (const li of list.children) {
    if (li.tagName.toLowerCase() !== "li") continue;
    const nested = [...li.children].filter(
      (child) => child.tagName === "UL" || child.tagName === "OL",
    );
    const body = li.cloneNode(true) as Element;
    body.querySelectorAll("ul, ol").forEach((entry) => entry.remove());
    const checked = li.getAttribute("data-checked") === "true";
    const marker = task
      ? checked
        ? "☑"
        : "☐"
      : ordered
        ? `${index}.`
        : "•";
    index += 1;
    blocks.push({ kind: "item", marker, runs: inlineRuns(body), depth });
    for (const child of nested) blocks.push(...collectList(child, depth + 1));
  }
  return blocks;
}

function wrapRuns(
  runs: Run[],
  font: PDFFont,
  size: number,
  maxWidth: number,
): Run[][] {
  const lines: Run[][] = [[]];
  let width = 0;
  function push(run: Run) {
    const last = lines[lines.length - 1];
    if (!last) return;
    last.push(run);
    width += font.widthOfTextAtSize(run.text, size);
  }
  function breakLine() {
    lines.push([]);
    width = 0;
  }
  for (const run of runs) {
    const parts = run.text.split(/(\n)/);
    for (const part of parts) {
      if (part === "\n") {
        breakLine();
        continue;
      }
      const words = part.split(/(\s+)/);
      for (const word of words) {
        if (!word) continue;
        const wordWidth = font.widthOfTextAtSize(word, size);
        if (width > 0 && width + wordWidth > maxWidth) breakLine();
        if (wordWidth > maxWidth && word.trim()) {
          let rest = word;
          while (rest) {
            let take = rest.length;
            while (
              take > 1 &&
              font.widthOfTextAtSize(rest.slice(0, take), size) > maxWidth
            ) {
              take -= 1;
            }
            push({ text: rest.slice(0, take), bold: run.bold });
            rest = rest.slice(take);
            if (rest) breakLine();
          }
          continue;
        }
        push({ text: word, bold: run.bold });
      }
    }
  }
  return lines.filter((line) => line.some((run) => run.text.length > 0));
}

function contentWidth(indent = 0): number {
  return PAGE_WIDTH - MARGIN * 2 - indent;
}

async function blobToPng(blob: Blob): Promise<Uint8Array> {
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, image.naturalWidth);
    canvas.height = Math.max(1, image.naturalHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(image, 0, 0);
    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (next) => (next ? resolve(next) : reject(new Error("png"))),
        "image/png",
      );
    });
    return new Uint8Array(await png.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function embedImage(
  doc: import("pdf-lib").PDFDocument,
  blob: Blob,
): Promise<PDFImage> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const type = blob.type;
  try {
    if (type.includes("png") || bytes[0] === 0x89) return await doc.embedPng(bytes);
    if (type.includes("jpeg") || type.includes("jpg") || bytes[0] === 0xff) {
      return await doc.embedJpg(bytes);
    }
  } catch {
    // Fall through to rasterize.
  }
  return doc.embedPng(await blobToPng(blob));
}

type Layout = {
  doc: import("pdf-lib").PDFDocument;
  font: PDFFont;
  ink: ReturnType<typeof import("pdf-lib").rgb>;
  muted: ReturnType<typeof import("pdf-lib").rgb>;
  page: PDFPage;
  y: number;
};

function ensureSpace(layout: Layout, needed: number) {
  if (layout.y - needed >= MARGIN) return;
  layout.page = layout.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  layout.y = PAGE_HEIGHT - MARGIN;
}

function drawRuns(
  layout: Layout,
  lines: Run[][],
  size: number,
  x: number,
  lineHeight: number,
) {
  for (const line of lines) {
    ensureSpace(layout, lineHeight);
    let cursor = x;
    for (const run of line) {
      if (!run.text) continue;
      layout.page.drawText(run.text, {
        x: cursor,
        y: layout.y,
        size,
        font: layout.font,
        color: layout.ink,
      });
      if (run.bold) {
        layout.page.drawText(run.text, {
          x: cursor + 0.35,
          y: layout.y,
          size,
          font: layout.font,
          color: layout.ink,
        });
      }
      cursor += layout.font.widthOfTextAtSize(run.text, size);
    }
    layout.y -= lineHeight;
  }
}

export async function htmlContentToPdf(
  title: string,
  html: string,
  options?: { textScale?: number; media?: Map<string, Blob> },
): Promise<Uint8Array> {
  const { PDFDocument, rgb } = await import("pdf-lib");
  const fontkit = (await import("@pdf-lib/fontkit")).default;
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(await loadKbPdfFont(), { subset: true });
  const scale = options?.textScale ?? 1;
  const media = options?.media ?? new Map<string, Blob>();
  const parsed = new DOMParser().parseFromString(html || "<p></p>", "text/html");
  const blocks = collectBlocks(parsed.body);
  const layout: Layout = {
    doc,
    font,
    ink: rgb(0.04, 0.09, 0.22),
    muted: rgb(0.35, 0.4, 0.48),
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: PAGE_HEIGHT - MARGIN,
  };

  const titleSize = 18 * scale;
  const titleLines = wrapRuns(
    [{ text: title, bold: true }],
    font,
    titleSize,
    contentWidth(),
  );
  drawRuns(layout, titleLines, titleSize, MARGIN, titleSize * 1.25);
  layout.y -= 10 * scale;

  for (const block of blocks) {
    if (block.kind === "heading") {
      const size = (block.level === 1 ? 16 : block.level === 2 ? 13.5 : 12) * scale;
      layout.y -= 8 * scale;
      drawRuns(
        layout,
        wrapRuns(block.runs, font, size, contentWidth()),
        size,
        MARGIN,
        size * 1.28,
      );
      layout.y -= 4 * scale;
      continue;
    }
    if (block.kind === "paragraph") {
      const size = 11 * scale;
      const lines = wrapRuns(block.runs, font, size, contentWidth());
      if (lines.length === 0) {
        layout.y -= 6 * scale;
        continue;
      }
      drawRuns(layout, lines, size, MARGIN, size * 1.42);
      layout.y -= 4 * scale;
      continue;
    }
    if (block.kind === "quote") {
      const size = 11 * scale;
      const indent = 16;
      drawRuns(
        layout,
        wrapRuns(block.runs, font, size, contentWidth(indent)),
        size,
        MARGIN + indent,
        size * 1.42,
      );
      layout.y -= 6 * scale;
      continue;
    }
    if (block.kind === "code") {
      const size = 9 * scale;
      const lines = block.text.split("\n").flatMap((line) =>
        wrapRuns([{ text: line || " " }], font, size, contentWidth()),
      );
      drawRuns(layout, lines, size, MARGIN, size * 1.35);
      layout.y -= 6 * scale;
      continue;
    }
    if (block.kind === "item") {
      const size = 11 * scale;
      const indent = 14 * block.depth + 8;
      const marker = `${block.marker} `;
      const markerWidth = font.widthOfTextAtSize(marker, size);
      const lines = wrapRuns(
        block.runs,
        font,
        size,
        contentWidth(indent + markerWidth),
      );
      ensureSpace(layout, size * 1.42);
      layout.page.drawText(marker, {
        x: MARGIN + indent,
        y: layout.y,
        size,
        font,
        color: layout.ink,
      });
      if (lines.length === 0) {
        layout.y -= size * 1.42;
        continue;
      }
      const first = lines[0] ?? [];
      let cursor = MARGIN + indent + markerWidth;
      for (const run of first) {
        layout.page.drawText(run.text, {
          x: cursor,
          y: layout.y,
          size,
          font,
          color: layout.ink,
        });
        cursor += font.widthOfTextAtSize(run.text, size);
      }
      layout.y -= size * 1.42;
      drawRuns(
        layout,
        lines.slice(1),
        size,
        MARGIN + indent + markerWidth,
        size * 1.42,
      );
      continue;
    }
    if (block.kind === "video") {
      const size = 11 * scale;
      drawRuns(layout, [[{ text: "[Video]" }]], size, MARGIN, size * 1.42);
      layout.y -= 4 * scale;
      continue;
    }
    const blob = media.get(block.mediaId) ?? (await loadMedia(block.mediaId));
    if (!blob || !blob.type.startsWith("image/")) continue;
    try {
      const image = await embedImage(doc, blob);
      const maxW =
        contentWidth() * (Math.min(Math.max(block.widthPct, 20), 100) / 100);
      const maxH = PAGE_HEIGHT - MARGIN * 2;
      let width = image.width;
      let height = image.height;
      const fit = Math.min(maxW / width, maxH / height, 1);
      width *= fit;
      height *= fit;
      ensureSpace(layout, height + 8);
      layout.y -= height;
      layout.page.drawImage(image, {
        x: MARGIN,
        y: layout.y,
        width,
        height,
      });
      layout.y -= 10 * scale;
    } catch {
      // Skip images that cannot be embedded.
    }
  }

  return doc.save();
}
