import { KbDownloadButton } from "@/components/KbDownloadButton";
import { KbFileViewer } from "@/components/KbFileViewer";
import { KbExplorer } from "@/components/KbExplorer";
import { KbMediaControl } from "@/components/KbMediaControl";
import { KbPageLinkControl } from "@/components/KbPageLinkControl";
import { KbTextScaleControl } from "@/components/KbTextScaleControl";
import { RichEditorToolbar } from "@/components/RichEditorToolbar";
import { IconChevron, IconSearch } from "@/components/icons";
import {
  findInEditor,
  KB_EXTENSIONS,
  previewFindMatches,
} from "@/lib/editor";
import { MEDIA_ERROR_EVENT } from "@/lib/media";
import {
  defaultPageTitle,
  isKbFile,
  isKbPage,
  KB_TEXT_SCALE_DEFAULT,
  pageIdFromHref,
} from "@/lib/kb";
import { isEditorKbFileName, isOfficeKbFile, isPdfKbFile } from "@/lib/kbFiles";
import { isBlankHtml, isDefaultNoteTitle } from "@/lib/notes";
import { useItemsStore } from "@/store/useItemsStore";
import { useKbStore } from "@/store/useKbStore";
import { useUiStore } from "@/store/useUiStore";
import type { LifelyKbFile, LifelyKbPage } from "@/types";
import { EditorContent, useEditor } from "@tiptap/react";
import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from "react";

const KbOfficeViewer = lazy(() =>
  import("@/components/KbOfficeViewer").then((mod) => ({
    default: mod.KbOfficeViewer,
  })),
);
const KbPdfEditor = lazy(() =>
  import("@/components/KbPdfEditor").then((mod) => ({ default: mod.KbPdfEditor })),
);

export function KnowledgeScreen() {
  const nodes = useKbStore((state) => state.nodes);
  const hydrateEditableFile = useKbStore((state) => state.hydrateEditableFile);
  const kbPageId = useUiStore((state) => state.kbPageId);
  const node = nodes.find((entry) => entry.id === kbPageId);

  useEffect(() => {
    if (
      node &&
      isKbFile(node) &&
      isEditorKbFileName(node.title) &&
      node.content === null
    ) {
      void hydrateEditableFile(node.id);
    }
  }, [hydrateEditableFile, node]);

  if (node && isKbFile(node) && isEditorKbFileName(node.title)) {
    if (node.content === null) {
      return (
        <p className="grid h-full place-items-center text-[15px] text-ink-secondary">
          Učitavanje…
        </p>
      );
    }
    return <KbPageEditor key={node.id} nodeId={node.id} />;
  }
  if (node && isKbFile(node) && isPdfKbFile(node)) {
    return (
      <Suspense
        fallback={
          <p className="grid h-full place-items-center text-[15px] text-ink-secondary">
            Učitavanje…
          </p>
        }
      >
        <KbPdfEditor key={node.id} fileId={node.id} />
      </Suspense>
    );
  }
  if (node && isKbFile(node) && isOfficeKbFile(node) && node.mediaId) {
    return (
      <Suspense
        fallback={
          <p className="grid h-full place-items-center text-[15px] text-ink-secondary">
            Učitavanje…
          </p>
        }
      >
        <KbOfficeViewer key={node.id} fileId={node.id} />
      </Suspense>
    );
  }
  if (
    node &&
    isKbFile(node) &&
    isOfficeKbFile(node) &&
    typeof node.content === "string"
  ) {
    return <KbPageEditor key={node.id} nodeId={node.id} />;
  }
  if (node && isKbFile(node)) {
    return <KbFileViewer key={node.id} fileId={node.id} />;
  }
  if (node && isKbPage(node)) {
    return <KbPageEditor key={node.id} nodeId={node.id} />;
  }
  return <KbExplorer variant="page" />;
}

type EditableDoc = LifelyKbPage | (LifelyKbFile & { content: string });

function KbPageEditor({ nodeId }: { nodeId: string }) {
  const nodes = useKbStore((state) => state.nodes);
  const page = nodes.find((entry): entry is EditableDoc => {
    if (entry.id !== nodeId) return false;
    if (isKbPage(entry)) return true;
    return isKbFile(entry) && typeof entry.content === "string";
  });
  const updateNode = useKbStore((state) => state.updateNode);
  const deleteNode = useKbStore((state) => state.deleteNode);
  const closeKbPage = useUiStore((state) => state.closeKbPage);
  const openKbPage = useUiStore((state) => state.openKbPage);
  const requestDeleteKb = useUiStore((state) => state.requestDeleteKb);
  const saveTimer = useRef<number | null>(null);
  const updateRef = useRef(updateNode);
  updateRef.current = updateNode;
  const openPageRef = useRef(openKbPage);
  openPageRef.current = openKbPage;
  const initialContent = useRef(page?.content || "<p></p>");
  const [findQuery, setFindQuery] = useState("");
  const [findResult, setFindResult] = useState({ index: 0, total: 0 });
  const [mediaMessage, setMediaMessage] = useState<string | null>(null);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

  const editor = useEditor(
    {
      immediatelyRender: false,
      shouldRerenderOnTransaction: true,
      extensions: KB_EXTENSIONS,
      content: initialContent.current,
      editorProps: {
        attributes: {
          class: "note-body outline-none min-h-full",
        },
      },
      onUpdate: ({ editor: instance }) => {
        if (saveTimer.current) window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(() => {
          updateRef.current(nodeId, { content: instance.getHTML() });
        }, 280);
      },
    },
    [nodeId],
  );
  editorRef.current = editor;

  function goFind(direction: 1 | -1) {
    if (!editor || editor.isDestroyed) return;
    setFindResult(findInEditor(editor, findQuery, direction));
  }

  function onFindQueryChange(value: string) {
    setFindQuery(value);
    if (!editor || editor.isDestroyed) {
      setFindResult({ index: 0, total: 0 });
      return;
    }
    setFindResult(previewFindMatches(editor, value));
  }

  useEffect(() => {
    function onError(event: Event) {
      const message = (event as CustomEvent<string>).detail;
      if (message) setMediaMessage(message);
    }
    window.addEventListener(MEDIA_ERROR_EVENT, onError);
    return () => window.removeEventListener(MEDIA_ERROR_EVENT, onError);
  }, []);

  useEffect(() => {
    if (!mediaMessage) return;
    const timer = window.setTimeout(() => setMediaMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [mediaMessage]);

  useEffect(() => {
    const dom = editor?.view.dom;
    if (!dom) return;
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      const id = pageIdFromHref(anchor?.getAttribute("href"));
      if (!id || id === nodeId) return;
      event.preventDefault();
      event.stopPropagation();
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      const instance = editorRef.current;
      if (instance && !instance.isDestroyed) {
        updateRef.current(nodeId, { content: instance.getHTML() });
      }
      const next = useKbStore
        .getState()
        .nodes.find((node) => node.id === id && isKbPage(node));
      if (next) openPageRef.current(next.id, next.parentId);
    }
    dom.addEventListener("click", onClick);
    return () => dom.removeEventListener("click", onClick);
  }, [editor, nodeId]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      if (editor && !editor.isDestroyed) {
        updateNode(nodeId, { content: editor.getHTML() });
      }
    };
  }, [editor, nodeId, updateNode]);

  if (!page) return null;

  function back() {
    if (!page) {
      closeKbPage();
      return;
    }
    const untitled =
      isKbPage(page) &&
      (!page.title.trim() || isDefaultNoteTitle(page.title, page.createdAt));
    if (isKbPage(page) && isBlankHtml(page.content) && untitled) {
      deleteNode(page.id);
    } else if (!page.title.trim()) {
      updateNode(page.id, {
        title: isKbPage(page)
          ? defaultPageTitle(new Date(page.createdAt))
          : page.title || "Fajl",
      });
    }
    closeKbPage();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-2 px-2 pt-2 md:px-4 md:pt-5">
        <button
          type="button"
          onClick={back}
          className="pressable inline-flex min-h-11 items-center gap-0.5 rounded-full px-2 text-[16px] text-accent"
        >
          <IconChevron className="size-5" />
          Knowledge
        </button>
        <div className="flex shrink-0 items-center">
          <KbDownloadButton
            nodeId={page.id}
            variant="label"
            beforeDownload={() => {
              if (saveTimer.current) window.clearTimeout(saveTimer.current);
              if (editor && !editor.isDestroyed) {
                updateNode(page.id, { content: editor.getHTML() });
              }
            }}
          />
          <button
            type="button"
            onClick={() =>
              requestDeleteKb(isKbPage(page) ? "kb-page" : "kb-file", page.id)
            }
            className="pressable min-h-11 rounded-full px-3 text-[16px] text-danger"
          >
            Obriši
          </button>
        </div>
      </header>
      <input
        value={page.title}
        onChange={(event) => updateNode(page.id, { title: event.target.value })}
        onBlur={() => {
          if (!page.title.trim()) {
            updateNode(page.id, {
              title: isKbPage(page)
                ? defaultPageTitle(new Date(page.createdAt))
                : "Fajl",
            });
          }
        }}
        placeholder="Naslov"
        className="w-full shrink-0 bg-transparent px-5 py-2 font-display text-[32px] font-semibold leading-tight tracking-[-0.03em] outline-none placeholder:text-ink-tertiary md:px-8"
      />
      {editor && (
        <RichEditorToolbar
          editor={editor}
          extra={
            <>
              <KbTextScaleControl
                scale={page.textScale ?? KB_TEXT_SCALE_DEFAULT}
                onChange={(textScale) => updateNode(page.id, { textScale })}
              />
              <KbMediaControl editor={editor} />
              <KbPageLinkControl editor={editor} currentPageId={page.id} />
            </>
          }
        />
      )}
      {editor && (
        <div className="shrink-0 px-3 pb-2 md:px-6">
          <div className="flex h-11 items-center gap-2 rounded-2xl bg-surface-2/90 px-3">
            <IconSearch className="size-4 shrink-0 text-ink-tertiary" />
            <input
              value={findQuery}
              onChange={(event) => onFindQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  goFind(event.shiftKey ? -1 : 1);
                }
              }}
              placeholder="Pronađi u tekstu"
              aria-label="Pronađi u tekstu"
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-tertiary"
            />
            {findQuery.trim() ? (
              <span
                aria-live="polite"
                aria-label={
                  findResult.total === 0
                    ? "Nema podudaranja"
                    : findResult.index > 0
                      ? `${findResult.index} od ${findResult.total} podudaranja`
                      : `${findResult.total} podudaranja`
                }
                className="shrink-0 tabular-nums text-[13px] text-ink-tertiary"
              >
                {findResult.total === 0
                  ? "0"
                  : findResult.index > 0
                    ? `${findResult.index} od ${findResult.total}`
                    : String(findResult.total)}
              </span>
            ) : null}
            <button
              type="button"
              aria-label="Prethodno"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => goFind(-1)}
              className="grid size-8 place-items-center text-ink-secondary"
            >
              <IconChevron className="size-4 rotate-90" />
            </button>
            <button
              type="button"
              aria-label="Sledeće"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => goFind(1)}
              className="grid size-8 place-items-center text-ink-secondary"
            >
              <IconChevron className="size-4 -rotate-90" />
            </button>
          </div>
          {mediaMessage ? (
            <p className="px-1 pt-1.5 text-[13px] text-danger">{mediaMessage}</p>
          ) : null}
        </div>
      )}
      <div
        data-kb-page-scroll
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 md:px-8"
        style={
          {
            "--note-text-scale": String(
              page.textScale ?? KB_TEXT_SCALE_DEFAULT,
            ),
          } as CSSProperties
        }
      >
        <EditorContent editor={editor} className="h-full min-h-[50%]" />
        <LinkedTodos pageId={page.id} />
      </div>
    </div>
  );
}

function LinkedTodos({ pageId }: { pageId: string }) {
  const items = useItemsStore((state) => state.items);
  const linked = items.filter((item) => item.kbPageId === pageId);
  const openEditItem = useUiStore((state) => state.openEditItem);
  if (linked.length === 0) return null;

  return (
    <section className="mt-8 pb-8">
      <h2 className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-secondary">
        Povezane stavke
      </h2>
      <div className="card overflow-hidden rounded-[22px]">
        {linked.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => openEditItem(item.id)}
            className="flex min-h-12 w-full items-center px-4 text-left text-[15px] shadow-[0_0.5px_0_0_var(--hairline)] last:shadow-none"
          >
            {item.title}
          </button>
        ))}
      </div>
    </section>
  );
}
