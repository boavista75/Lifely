import { noteCreatedTitle } from "@/lib/dates";
import { text } from "@/i18n";

export function notePreview(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function isBlankHtml(html: string): boolean {
  if (/<(img|video)\b/i.test(html) || /data-media-id=/i.test(html)) {
    return false;
  }
  return notePreview(html).length === 0;
}

export function displayNoteTitle(title: string, createdAt?: string): string {
  const trimmed = title.trim();
  if (trimmed.length > 0) return trimmed;
  if (createdAt) return noteCreatedTitle(new Date(createdAt));
  return text("notes.untitled");
}

export function isDefaultNoteTitle(title: string, createdAt: string): boolean {
  const trimmed = title.trim();
  const date = new Date(createdAt);
  return trimmed === noteCreatedTitle(date, "sr") || trimmed === noteCreatedTitle(date, "en");
}
