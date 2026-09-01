import fontUrl from "@/assets/fonts/LiberationSans-Regular.ttf?url";

export const PDF_ZOOM_DEFAULT = 1;
export const PDF_ZOOM_MIN = 0.1;
export const PDF_ZOOM_MAX = 3;
export const PDF_ZOOM_STEP = 0.1;

export type PdfTextLine = {
  id: string;
  pageIndex: number;
  original: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
};

type PdfEditSidecar = {
  v: 1;
  edits: Omit<PdfTextLine, "original">[];
};

let fontBytesPromise: Promise<ArrayBuffer> | null = null;

export function clampPdfZoom(value: number): number {
  const stepped = Math.round(value / PDF_ZOOM_STEP) * PDF_ZOOM_STEP;
  return Math.min(
    PDF_ZOOM_MAX,
    Math.max(PDF_ZOOM_MIN, Number(stepped.toFixed(1))),
  );
}

export function parsePdfEdits(content: string | null): PdfTextLine[] {
  if (!content?.startsWith("{")) return [];
  try {
    const parsed = JSON.parse(content) as PdfEditSidecar;
    if (parsed.v !== 1 || !Array.isArray(parsed.edits)) return [];
    return parsed.edits
      .filter(
        (edit) =>
          typeof edit.id === "string" &&
          typeof edit.pageIndex === "number" &&
          typeof edit.text === "string",
      )
      .map((edit) => ({ ...edit, original: edit.text }));
  } catch {
    return [];
  }
}

export function serializePdfEdits(lines: PdfTextLine[]): string {
  const edits = lines
    .filter((line) => line.text !== line.original)
    .map((line) => ({
      id: line.id,
      pageIndex: line.pageIndex,
      text: line.text,
      x: line.x,
      y: line.y,
      width: line.width,
      height: line.height,
      fontSize: line.fontSize,
    }));
  if (edits.length === 0) return "";
  return JSON.stringify({ v: 1, edits } satisfies PdfEditSidecar);
}

export function applyLineOverrides(
  lines: PdfTextLine[],
  overrides: Record<string, string>,
): PdfTextLine[] {
  return lines.map((line) =>
    line.id in overrides ? { ...line, text: overrides[line.id] ?? line.text } : line,
  );
}

export function mergePdfLines(
  extracted: PdfTextLine[],
  saved: PdfTextLine[],
): PdfTextLine[] {
  if (saved.length === 0) return extracted;
  const used = new Set<number>();
  const merged: PdfTextLine[] = [];
  for (const edit of saved) {
    merged.push(edit);
    extracted.forEach((line, index) => {
      if (line.pageIndex === edit.pageIndex && overlaps(line, edit)) {
        used.add(index);
      }
    });
  }
  extracted.forEach((line, index) => {
    if (!used.has(index)) merged.push(line);
  });
  return merged.sort(
    (a, b) => a.pageIndex - b.pageIndex || b.y - a.y || a.x - b.x,
  );
}

export function linesFromTextItems(
  pageIndex: number,
  items: unknown[],
): PdfTextLine[] {
  const usable = items.filter(isTextItem).filter((item) => item.str.length > 0);
  usable.sort(
    (a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4],
  );
  const rows: PdfJsTextItem[][] = [];
  for (const item of usable) {
    const fontSize = itemFontSize(item);
    const y = item.transform[5] as number;
    const row = rows.find((entries) => {
      const sample = entries[0];
      if (!sample) return false;
      return (
        Math.abs((sample.transform[5] as number) - y) <=
        Math.max(itemFontSize(sample), fontSize) * 0.35
      );
    });
    if (row) row.push(item);
    else rows.push([item]);
  }

  return rows.map((row, index) => {
    const ordered = [...row].sort(
      (a, b) => (a.transform[4] as number) - (b.transform[4] as number),
    );
    let text = "";
    let prevRight = 0;
    for (const item of ordered) {
      const x = item.transform[4] as number;
      const size = itemFontSize(item);
      if (text && x - prevRight > size * 0.12) text += " ";
      text += item.str;
      prevRight = x + item.width;
    }
    const first = ordered[0];
    const last = ordered[ordered.length - 1];
    if (!first || !last) {
      return {
        id: `${pageIndex}:${index}`,
        pageIndex,
        original: text,
        text,
        x: 0,
        y: 0,
        width: 0,
        height: 12,
        fontSize: 12,
      };
    }
    const fontSize = Math.max(...ordered.map(itemFontSize));
    const x = first.transform[4] as number;
    const y = Math.min(...ordered.map((item) => item.transform[5] as number));
    const width = last.transform[4] + last.width - x;
    return {
      id: `${pageIndex}:${x.toFixed(2)}:${y.toFixed(2)}:${index}`,
      pageIndex,
      original: text,
      text,
      x,
      y,
      width: Math.max(width, fontSize),
      height: fontSize,
      fontSize,
    };
  });
}

export async function bakePdfEdits(
  source: Uint8Array,
  lines: PdfTextLine[],
): Promise<Uint8Array> {
  const changed = lines.filter((line) => line.text !== line.original);
  if (changed.length === 0) return source;
  const { PDFDocument, rgb } = await import("pdf-lib");
  const fontkit = (await import("@pdf-lib/fontkit")).default;
  const doc = await PDFDocument.load(source);
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(await loadKbPdfFont(), { subset: true });
  const pages = doc.getPages();
  for (const line of changed) {
    const page = pages[line.pageIndex];
    if (!page) continue;
    const size = Math.max(line.fontSize, 4);
    const textWidth = line.text ? font.widthOfTextAtSize(line.text, size) : 0;
    page.drawRectangle({
      x: line.x - 1,
      y: line.y - size * 0.22,
      width: Math.max(line.width, textWidth) + 2,
      height: size * 1.25,
      color: rgb(1, 1, 1),
    });
    if (line.text) {
      page.drawText(line.text, {
        x: line.x,
        y: line.y,
        size,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }
  return doc.save();
}

export function pdfBytesToBlob(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: "application/pdf" });
}

export function loadKbPdfFont(): Promise<ArrayBuffer> {
  fontBytesPromise ??= fetch(fontUrl).then((response) => {
    if (!response.ok) throw new Error("font");
    return response.arrayBuffer();
  });
  return fontBytesPromise;
}

type PdfJsTextItem = {
  str: string;
  transform: number[];
  width: number;
  height: number;
};

function itemFontSize(item: PdfJsTextItem): number {
  return Math.hypot(item.transform[0] ?? 0, item.transform[1] ?? 0) || item.height || 12;
}

function isTextItem(item: unknown): item is PdfJsTextItem {
  if (!item || typeof item !== "object") return false;
  if (!("str" in item) || !("transform" in item)) return false;
  return Array.isArray(item.transform);
}

function overlaps(a: PdfTextLine, b: PdfTextLine): boolean {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;
  return !(a.x > bx2 || b.x > ax2 || a.y > by2 || b.y > ay2);
}
