import { KbImage, KbMediaDrop, KbVideo } from "@/lib/kbMedia";
import { Extension } from "@tiptap/core";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Placeholder from "@tiptap/extension-placeholder";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const PLACEHOLDER = Placeholder.configure({
  placeholder: "Počni da pišeš…",
});

type FindMatch = { from: number; to: number };

export type FindResult = {
  index: number;
  total: number;
};

const findPluginKey = new PluginKey<DecorationSet>("kbFind");

const KbFindHighlight = Extension.create({
  name: "kbFindHighlight",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: findPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, set) {
            const next = tr.getMeta(findPluginKey) as DecorationSet | undefined;
            if (next) return next;
            if (tr.docChanged) return set.map(tr.mapping, tr.doc);
            return set;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

const TaskListPointerFix = Extension.create({
  name: "taskListPointerFix",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            mousedown(_view, event) {
              const target = event.target;
              if (!(target instanceof Element)) return false;
              if (!target.closest("ul[data-type='taskList'] > li > label")) {
                return false;
              }
              event.preventDefault();
              return true;
            },
          },
        },
      }),
    ];
  },
});

const TASK_LIST = [
  TaskList,
  TaskItem.configure({
    nested: true,
    a11y: {
      checkboxLabel: (_node, checked) =>
        checked ? "Završeno" : "Nije završeno",
    },
  }),
  TaskListPointerFix,
];

const EDITOR_LINK = {
  openOnClick: false,
  autolink: false,
  linkOnPaste: false,
  protocols: [{ scheme: "kb", optionalSlashes: true }],
  HTMLAttributes: {
    class: "kb-page-link",
    target: "_self",
    rel: "noopener noreferrer",
  },
  isAllowedUri: (url: string, ctx: { defaultValidate: (url: string) => boolean }) =>
    url.startsWith("kb://") || ctx.defaultValidate(url),
};

export const NOTE_EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: EDITOR_LINK,
  }),
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  PLACEHOLDER,
  ...TASK_LIST,
];

export const KB_EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: EDITOR_LINK,
  }),
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  PLACEHOLDER,
  ...TASK_LIST,
  KbImage,
  KbVideo,
  KbMediaDrop,
  KbFindHighlight,
];

export function collectFindMatches(
  editor: Editor,
  query: string,
): FindMatch[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const matches: FindMatch[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const haystack = node.text.toLowerCase();
    let index = 0;
    while (index <= haystack.length) {
      const found = haystack.indexOf(needle, index);
      if (found === -1) break;
      matches.push({
        from: pos + found,
        to: pos + found + needle.length,
      });
      index = found + Math.max(needle.length, 1);
    }
  });
  return matches;
}

export function applyFindHighlights(
  editor: Editor,
  matches: FindMatch[],
  currentIndex: number,
) {
  if (editor.isDestroyed) return;
  const decorations = matches.map((match, index) =>
    Decoration.inline(match.from, match.to, {
      class: index === currentIndex ? "kb-find-current" : "kb-find-match",
    }),
  );
  editor.view.dispatch(
    editor.state.tr.setMeta(
      findPluginKey,
      DecorationSet.create(editor.state.doc, decorations),
    ),
  );
}

export function previewFindMatches(editor: Editor, query: string): FindResult {
  const matches = collectFindMatches(editor, query);
  applyFindHighlights(editor, matches, -1);
  return { index: 0, total: matches.length };
}

export function findInEditor(
  editor: Editor,
  query: string,
  direction: 1 | -1,
): FindResult {
  const matches = collectFindMatches(editor, query);
  if (matches.length === 0) {
    applyFindHighlights(editor, [], -1);
    return { index: 0, total: 0 };
  }
  const cursor = editor.state.selection.from;
  const next =
    direction === 1
      ? (matches.find((match) => match.from > cursor) ?? matches[0])
      : ([...matches].reverse().find((match) => match.from < cursor) ??
        matches[matches.length - 1]);
  const currentIndex = matches.indexOf(next);
  editor.chain().setTextSelection(next).run();
  applyFindHighlights(editor, matches, currentIndex);
  scrollCurrentFindIntoView(editor);
  return { index: currentIndex + 1, total: matches.length };
}

function scrollCurrentFindIntoView(editor: Editor) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const current = editor.view.dom.querySelector(".kb-find-current");
      if (!current) return;
      const scroller = editor.view.dom.closest("[data-kb-page-scroll]");
      if (scroller instanceof HTMLElement) {
        const match = current.getBoundingClientRect();
        const box = scroller.getBoundingClientRect();
        const padding = 72;
        if (match.top < box.top + padding || match.bottom > box.bottom - padding) {
          const nextTop =
            scroller.scrollTop +
            (match.top - box.top) -
            box.height / 2 +
            match.height / 2;
          scroller.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
        }
        return;
      }
      current.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: "smooth",
      });
    });
  });
}
