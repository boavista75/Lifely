import sanitizeHtml from "sanitize-html";

const MEDIA_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const COLOR = [
  /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
  /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i,
  /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(?:0|1|0?\.\d+)\s*\)$/i,
];

export function cleanHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "strong",
      "em",
      "u",
      "s",
      "b",
      "i",
      "ul",
      "ol",
      "li",
      "a",
      "span",
      "mark",
      "blockquote",
      "code",
      "pre",
      "hr",
      "img",
      "video",
      "div",
      "label",
      "input",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    allowedAttributes: {
      a: ["href", "rel", "class"],
      span: ["style"],
      mark: ["style", "data-color"],
      img: ["data-media-id", "data-width", "data-align"],
      video: ["data-media-id", "data-width", "data-align", "controls"],
      ul: ["data-type"],
      ol: ["data-type"],
      li: ["data-type", "data-checked"],
      input: ["type", "checked", "disabled"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto", "kb"],
    allowedSchemesByTag: {
      a: ["http", "https", "mailto", "kb"],
    },
    allowProtocolRelative: false,
    allowedClasses: {
      a: ["kb-page-link"],
    },
    allowedStyles: {
      span: { color: COLOR },
      mark: { "background-color": COLOR, color: COLOR },
    },
    exclusiveFilter(frame) {
      if (frame.tag === "input" && frame.attribs.type !== "checkbox") return true;
      if (
        (frame.tag === "img" || frame.tag === "video") &&
        !MEDIA_ID.test(frame.attribs["data-media-id"] ?? "")
      ) {
        return true;
      }
      return false;
    },
  });
}
