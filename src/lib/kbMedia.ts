import { KbImageView, KbVideoView } from "@/components/KbMediaView";
import {
  filesFromTransfer,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  mediaKind,
  reportMediaError,
  saveMedia,
  type MediaAlign,
} from "@/lib/media";
import { mergeAttributes, Node, Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
import type { Editor } from "@tiptap/react";

type MediaAttrs = {
  mediaId: string;
  width?: number;
  align?: MediaAlign;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    kbImage: {
      setKbImage: (options: MediaAttrs) => ReturnType;
    };
    kbVideo: {
      setKbVideo: (options: MediaAttrs) => ReturnType;
    };
  }
}

const mediaAttributes = {
  mediaId: {
    default: null as string | null,
    parseHTML: (element: HTMLElement) => element.getAttribute("data-media-id"),
    renderHTML: (attributes: { mediaId?: string | null }) =>
      attributes.mediaId ? { "data-media-id": attributes.mediaId } : {},
  },
  width: {
    default: 100,
    parseHTML: (element: HTMLElement) => {
      const value = Number(element.getAttribute("data-width"));
      return Number.isFinite(value) && value > 0 ? value : 100;
    },
    renderHTML: (attributes: { width?: number }) => ({
      "data-width": String(attributes.width ?? 100),
    }),
  },
  align: {
    default: "center" as MediaAlign,
    parseHTML: (element: HTMLElement) => {
      const value = element.getAttribute("data-align");
      return value === "left" || value === "right" || value === "center"
        ? value
        : "center";
    },
    renderHTML: (attributes: { align?: MediaAlign }) => ({
      "data-align": attributes.align ?? "center",
    }),
  },
};

const nodeViewOptions = {
  as: "div" as const,
  className: "kb-media-node",
  stopEvent: ({ event }: { event: Event }) =>
    Boolean((event.target as HTMLElement | null)?.closest("[data-media-ui]")),
  ignoreMutation: () => true,
};

export const KbImage = Node.create({
  name: "kbImage",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => mediaAttributes,
  parseHTML() {
    return [{ tag: "img[data-media-id]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(KbImageView, nodeViewOptions);
  },
  addCommands() {
    return {
      setKbImage:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    };
  },
});

export const KbVideo = Node.create({
  name: "kbVideo",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => mediaAttributes,
  parseHTML() {
    return [{ tag: "video[data-media-id]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, { controls: "true" }),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(KbVideoView, nodeViewOptions);
  },
  addCommands() {
    return {
      setKbVideo:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    };
  },
});

export const KbMediaDrop = Extension.create({
  name: "kbMediaDrop",
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey("kbMediaDrop"),
        props: {
          handlePaste(_view, event) {
            return queueMedia(editor, filesFromTransfer(event.clipboardData));
          },
          handleDrop(view, event, _slice, moved) {
            if (moved) return false;
            const files = filesFromTransfer(event.dataTransfer);
            if (files.length === 0) return false;
            event.preventDefault();
            const coords = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });
            void insertMediaFiles(editor, files, coords?.pos);
            return true;
          },
        },
      }),
    ];
  },
});

function queueMedia(editor: Editor, files: File[]): boolean {
  const usable = files.filter((file) => mediaKind(file));
  if (usable.length === 0) return false;
  void insertMediaFiles(editor, usable);
  return true;
}

export async function insertMediaFiles(
  editor: Editor,
  files: File[],
  pos?: number,
): Promise<boolean> {
  const usable = files.filter((file) => mediaKind(file));
  if (usable.length === 0) return false;
  let insertAt = pos;
  for (const file of usable) {
    const kind = mediaKind(file);
    if (!kind) continue;
    if (kind === "image" && file.size > MAX_IMAGE_BYTES) {
      reportMediaError("Slika je prevelika (maks. 12 MB).");
      continue;
    }
    if (kind === "video" && file.size > MAX_VIDEO_BYTES) {
      reportMediaError("Video je prevelik (maks. 80 MB).");
      continue;
    }
    try {
      const mediaId = await saveMedia(file);
      const content = {
        type: kind === "image" ? "kbImage" : "kbVideo",
        attrs: { mediaId, width: 100, align: "center" as const },
      };
      if (typeof insertAt === "number") {
        editor.chain().insertContentAt(insertAt, content).run();
        insertAt += 1;
      } else {
        editor.chain().focus().insertContent(content).run();
      }
    } catch {
      reportMediaError("Fajl nije sačuvan.");
    }
  }
  return true;
}
