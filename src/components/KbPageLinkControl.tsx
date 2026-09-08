import {
  IconClose,
  IconFolder,
  IconGlobe,
  IconKnowledge,
} from "@/components/icons";
import { TOOL_BUTTON_CLASS, ToolButton } from "@/components/RichEditorToolbar";
import { cn } from "@/lib/cn";
import {
  displayKbTitle,
  displayWebHref,
  isKbFile,
  isKbPage,
  isWebHref,
  kbFolderPathLabel,
  kbHref,
  normalizeWebHref,
  pageIdFromHref,
  reachableKbIds,
} from "@/lib/kb";
import { useKbStore } from "@/store/useKbStore";
import type { LifelyKbFile, LifelyKbNode, LifelyKbPage } from "@/types";
import type { Editor } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

type LinkDoc = LifelyKbPage | LifelyKbFile;

function isLinkDoc(node: LifelyKbNode): node is LinkDoc {
  return isKbPage(node) || isKbFile(node);
}

export function KbPageLinkControl({
  editor,
  currentPageId,
}: {
  editor: Editor;
  currentPageId?: string;
}) {
  const nodes = useKbStore((state) => state.nodes);
  const groups = useMemo(() => {
    const live = reachableKbIds(nodes);
    const docs = nodes.filter(
      (node): node is LinkDoc =>
        isLinkDoc(node) && node.id !== currentPageId && live.has(node.id),
    );
    const byPath = new Map<string, LinkDoc[]>();
    for (const doc of docs) {
      const path = kbFolderPathLabel(nodes, doc.parentId);
      const list = byPath.get(path);
      if (list) list.push(doc);
      else byPath.set(path, [doc]);
    }
    for (const list of byPath.values()) {
      list.sort((a, b) =>
        displayKbTitle(a.title, a.createdAt).localeCompare(
          displayKbTitle(b.title, b.createdAt),
          "sr-Latn",
        ),
      );
    }
    return [...byPath.entries()].sort(([a], [b]) => {
      if (a === b) return 0;
      if (!a) return -1;
      if (!b) return 1;
      return a.localeCompare(b, "sr-Latn");
    });
  }, [currentPageId, nodes]);
  const docCount = groups.reduce((sum, [, docs]) => sum + docs.length, 0);
  const [open, setOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [urlError, setUrlError] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef({ from: 0, to: 0 });
  const href = editor.getAttributes("link").href as string | undefined;
  const linkedId = pageIdFromHref(href);
  const linked =
    nodes.find((node) => isLinkDoc(node) && node.id === linkedId) ?? null;
  const linkedWeb = isWebHref(href) ? href : null;

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    if (open) {
      setOpen(false);
      editor.chain().focus().run();
      return;
    }
    const { from, to } = editor.state.selection;
    selectionRef.current = { from, to };
    const current = editor.getAttributes("link").href as string | undefined;
    setUrlDraft(isWebHref(current) ? current : "");
    setUrlError(false);
    setOpen(true);
  }

  function applyHref(
    hrefValue: string,
    text: string,
    target: "_self" | "_blank",
  ) {
    const { from, to } = selectionRef.current;
    if (from === to) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .insertContent({
          type: "text",
          text,
          marks: [{ type: "link", attrs: { href: hrefValue, target } }],
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .setLink({ href: hrefValue, target })
        .run();
    }
    setOpen(false);
  }

  function applyPageLink(pageId: string, title: string) {
    applyHref(kbHref(pageId), title, "_self");
  }

  function applyWebLink(event: FormEvent) {
    event.preventDefault();
    const next = normalizeWebHref(urlDraft);
    if (!next) {
      setUrlError(true);
      urlInputRef.current?.focus();
      return;
    }
    applyHref(next, displayWebHref(next), "_blank");
  }

  function unlink() {
    const { from, to } = editor.state.selection;
    editor.chain().focus().setTextSelection({ from, to }).unsetLink().run();
    setOpen(false);
  }

  const rect = buttonRef.current?.getBoundingClientRect();

  return (
    <div ref={buttonRef} className="flex shrink-0">
      <ToolButton
        label="Link"
        active={open || editor.isActive("link")}
        onClick={toggle}
      >
        <span className="text-[13px] font-semibold underline">Link</span>
      </ToolButton>
      <button
        type="button"
        aria-label="Ukini link"
        disabled={!editor.isActive("link")}
        onMouseDown={(event) => event.preventDefault()}
        onClick={unlink}
        className={cn(
          TOOL_BUTTON_CLASS,
          "text-ink-secondary disabled:text-ink-tertiary disabled:opacity-40",
        )}
      >
        <IconClose className="size-4" />
      </button>
      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Link"
            onMouseDown={(event) => {
              if ((event.target as HTMLElement).closest("form")) return;
              event.preventDefault();
            }}
            className="glass fixed z-[55] flex max-h-80 flex-col overflow-hidden rounded-2xl py-1 shadow-[var(--shadow-float)]"
            style={{
              top: Math.min(rect.bottom + 8, window.innerHeight - 16),
              left: Math.max(12, Math.min(rect.left, window.innerWidth - 300)),
              width: 280,
            }}
          >
            <form
              noValidate
              onSubmit={applyWebLink}
              className="shrink-0 space-y-1.5 px-2.5 pb-2 pt-2"
            >
              <label className="flex items-center gap-1.5 px-1 text-[12px] font-medium text-ink-secondary">
                <IconGlobe className="size-3.5 shrink-0 text-ink-tertiary" />
                Internet
              </label>
              <div className="flex gap-1.5">
                <input
                  ref={urlInputRef}
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  placeholder="https://…"
                  value={urlDraft}
                  aria-invalid={urlError}
                  aria-label="Internet adresa"
                  onChange={(event) => {
                    setUrlDraft(event.target.value);
                    setUrlError(false);
                  }}
                  className={cn(
                    "h-10 min-w-0 flex-1 rounded-xl bg-surface-2 px-3 text-[14px] text-ink outline-none placeholder:text-ink-tertiary",
                    urlError && "ring-1 ring-danger",
                  )}
                />
                <button
                  type="submit"
                  className="h-10 shrink-0 rounded-xl px-3 text-[13px] font-medium text-accent"
                >
                  Dodaj
                </button>
              </div>
              {urlError ? (
                <p className="px-1 text-[12px] text-danger">
                  Unesi ispravan internet link
                </p>
              ) : null}
            </form>
            {linkedWeb ? (
              <p className="shrink-0 px-3.5 pb-1 text-[12px] font-medium text-ink-secondary">
                Povezano: {displayWebHref(linkedWeb)}
              </p>
            ) : linked ? (
              <p className="shrink-0 px-3.5 pb-1 text-[12px] font-medium text-ink-secondary">
                Povezano: {displayKbTitle(linked.title, linked.createdAt)}
              </p>
            ) : null}
            <div
              role="listbox"
              aria-label="Knowledge"
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            >
              {docCount === 0 ? (
                <p className="px-3.5 py-3 text-[13px] text-ink-tertiary">
                  {currentPageId
                    ? "Nema drugih dokumenata"
                    : "Nema dokumenata"}
                </p>
              ) : (
                groups.map(([path, docs]) => (
                  <div key={path || "__root"}>
                    <div className="sticky top-0 z-10 flex items-center gap-1.5 bg-surface px-3.5 pb-1 pt-2 text-[12px] font-medium text-ink-secondary">
                      {path ? (
                        <IconFolder className="size-3.5 shrink-0 text-ink-tertiary" />
                      ) : (
                        <IconKnowledge className="size-3.5 shrink-0 text-ink-tertiary" />
                      )}
                      <span className="min-w-0 truncate">
                        {path || "Na početku"}
                      </span>
                    </div>
                    {docs.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        role="option"
                        aria-selected={doc.id === linkedId}
                        onClick={() =>
                          applyPageLink(
                            doc.id,
                            displayKbTitle(doc.title, doc.createdAt),
                          )
                        }
                        className={cn(
                          "flex min-h-11 w-full items-center px-3.5 pl-8 text-left text-[15px]",
                          doc.id === linkedId ? "text-accent" : "text-ink",
                        )}
                      >
                        <span className="truncate">
                          {displayKbTitle(doc.title, doc.createdAt)}
                        </span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
