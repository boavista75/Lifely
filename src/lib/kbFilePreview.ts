import { fileExtension } from "@/lib/kbFiles";
import { marked } from "marked";

export const KB_FILE_UNOPENABLE =
  "Fajl nije moguce otvoriti u web pregledacu";

marked.setOptions({ gfm: true, breaks: false });

export async function convertDocumentToHtml(
  blob: Blob,
  fileName: string,
): Promise<string> {
  const ext = fileExtension(fileName);
  if (ext === "md") {
    const html = marked.parse(await blob.text(), { async: false });
    return sanitizeHtml(typeof html === "string" ? html : "") || "<p></p>";
  }
  if (ext === "txt") {
    return textToHtml(await blob.text());
  }
  return "<p></p>";
}

function textToHtml(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return "<p></p>";
  return normalized
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sanitizeHtml(html: string): string {
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
  return doc.body.innerHTML;
}

function decodeText(value: string): string {
  return value.replace(/\u00a0/g, " ");
}

function inlineMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return decodeText(node.textContent ?? "");
  if (!(node instanceof Element)) return "";
  const tag = node.tagName.toLowerCase();
  const inner = [...node.childNodes].map(inlineMarkdown).join("");
  if (tag === "br") return "\n";
  if (tag === "strong" || tag === "b") return `**${inner}**`;
  if (tag === "em" || tag === "i") return `*${inner}*`;
  if (tag === "code" && node.parentElement?.tagName.toLowerCase() !== "pre") {
    return `\`${inner}\``;
  }
  if (tag === "a") {
    const href = node.getAttribute("href") ?? "";
    if (href && !href.startsWith("kb://")) return `[${inner}](${href})`;
    return inner;
  }
  return inner;
}

function blockMarkdown(node: Node, orderedIndex?: { value: number }): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = decodeText(node.textContent ?? "").trim();
    return text ? `${text}\n\n` : "";
  }
  if (!(node instanceof Element)) return "";
  const tag = node.tagName.toLowerCase();
  if (tag === "h1") return `# ${inlineMarkdown(node).trim()}\n\n`;
  if (tag === "h2") return `## ${inlineMarkdown(node).trim()}\n\n`;
  if (tag === "h3") return `### ${inlineMarkdown(node).trim()}\n\n`;
  if (tag === "p") return `${inlineMarkdown(node).trim()}\n\n`;
  if (tag === "blockquote") {
    const body = [...node.childNodes]
      .map((child) => blockMarkdown(child))
      .join("")
      .trim();
    return `${body
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n")}\n\n`;
  }
  if (tag === "pre") return `\`\`\`\n${(node.textContent ?? "").trimEnd()}\n\`\`\`\n\n`;
  if (tag === "ul" || tag === "ol") {
    const ordered = tag === "ol";
    const counter = { value: 1 };
    return `${[...node.children]
      .map((child) => blockMarkdown(child, ordered ? counter : undefined))
      .join("")}\n`;
  }
  if (tag === "li") {
    const nested = [...node.children].filter(
      (child) => child.tagName === "UL" || child.tagName === "OL",
    );
    const contentNodes = [...node.childNodes].filter((child) => {
      return !(child instanceof Element) || (child.tagName !== "UL" && child.tagName !== "OL");
    });
    const text = contentNodes.map((child) => inlineMarkdown(child)).join("").trim();
    const task = node.closest("ul[data-type='taskList']");
    const checked = node.getAttribute("data-checked") === "true";
    const bullet = task
      ? `- [${checked ? "x" : " "}] `
      : orderedIndex
        ? `${orderedIndex.value++}. `
        : "- ";
    const nestedMd = nested.map((child) => blockMarkdown(child)).join("");
    return `${bullet}${text}\n${nestedMd}`;
  }
  if (tag === "hr") return "---\n\n";
  return [...node.childNodes].map((child) => blockMarkdown(child, orderedIndex)).join("");
}

export function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html || "<p></p>", "text/html");
  return blockMarkdown(doc.body).replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export function htmlToPlainText(html: string): string {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  const text = (doc.body.innerText || doc.body.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text ? `${text}\n` : "";
}
