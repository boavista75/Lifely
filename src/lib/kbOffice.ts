import { fileExtension } from "@/lib/kbFiles";
import { repairMsDocImages } from "@/lib/kbDocImages";

const DOCX_OPTIONS = {
  inWrapper: true,
  breakPages: true,
  ignoreWidth: false,
  ignoreHeight: false,
  ignoreFonts: false,
  experimental: true,
  renderHeaders: true,
  renderFooters: true,
  renderFootnotes: true,
  renderEndnotes: true,
  useBase64URL: true,
  className: "docx",
};

export async function renderOfficeDocument(
  blob: Blob,
  fileName: string,
  container: HTMLElement,
): Promise<void> {
  const buffer = await blob.arrayBuffer();
  const kind = sniffOffice(buffer, fileName);
  container.replaceChildren();
  if (kind === "docx") {
    const { renderAsync } = await import("docx-preview");
    await renderAsync(buffer, container, container, DOCX_OPTIONS);
    return;
  }
  if (kind === "html") {
    mountHtml(container, new TextDecoder("utf-8").decode(buffer));
    return;
  }
  const { parseMsDoc, renderMsDoc, mountMsDoc } = await import("@file-viewer/doc");
  const parsed = parseMsDoc(buffer);
  await repairMsDocImages(parsed, buffer);
  mountMsDoc(container, renderMsDoc(parsed));
}

function sniffOffice(
  buffer: ArrayBuffer,
  fileName: string,
): "docx" | "html" | "doc" {
  const ext = fileExtension(fileName);
  const bytes = new Uint8Array(buffer);
  if (isZip(bytes) || ext === "docx") return "docx";
  const head = new TextDecoder("latin1")
    .decode(bytes.slice(0, 256))
    .trimStart()
    .toLowerCase();
  if (head.startsWith("<html") || head.startsWith("<!doctype html")) {
    return "html";
  }
  return "doc";
}

function isZip(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

function mountHtml(container: HTMLElement, html: string): void {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll("script, iframe, object, embed, link, meta")
    .forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((element) => {
    for (const attr of [...element.attributes]) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith("on") || value.startsWith("javascript:")) {
        element.removeAttribute(attr.name);
      }
    }
  });
  const wrap = document.createElement("div");
  wrap.className = "kb-office-html";
  wrap.append(...doc.body.childNodes);
  container.replaceChildren(wrap);
}
