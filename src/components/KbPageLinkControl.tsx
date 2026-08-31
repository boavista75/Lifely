import { IconClose } from "@/components/icons";
import { ToolButton } from "@/components/RichEditorToolbar";
import { cn } from "@/lib/cn";
import {
  displayKbTitle,
  isKbPage,
  kbHref,
  pageIdFromHref,
} from "@/lib/kb";
import { useKbStore } from "@/store/useKbStore";
import type { Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function KbPageLinkControl({
  editor,
  currentPageId,
}: {
  editor: Editor;
  currentPageId: string;
}) {
  const nodes = useKbStore((state) => state.nodes);
  const pages = nodes.filter(isKbPage).filter((page) => page.id !== currentPageId);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef({ from: 0, to: 0 });
  const href = editor.getAttributes("link").href as string | undefined;
  const linkedId = pageIdFromHref(href);
  const linked =
    nodes.find((node) => isKbPage(node) && node.id === linkedId) ?? null;

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
    setOpen(true);
  }

  function applyLink(pageId: string, title: string) {
    const { from, to } = selectionRef.current;
    const hrefValue = kbHref(pageId);
    if (from === to) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .insertContent({
          type: "text",
          text: title,
          marks: [{ type: "link", attrs: { href: hrefValue } }],
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .setLink({ href: hrefValue })
        .run();
    }
    setOpen(false);
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
        label="Link ka stranici"
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
        className="grid h-11 min-w-11 shrink-0 place-items-center rounded-lg text-ink-secondary disabled:text-ink-tertiary disabled:opacity-40"
      >
        <IconClose className="size-4" />
      </button>
      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            aria-label="Stranice"
            onMouseDown={(event) => event.preventDefault()}
            className="glass fixed z-[55] max-h-64 overflow-y-auto overscroll-contain rounded-2xl py-1 shadow-[var(--shadow-float)]"
            style={{
              top: Math.min(rect.bottom + 8, window.innerHeight - 16),
              left: Math.max(12, Math.min(rect.left, window.innerWidth - 268)),
              width: 248,
            }}
          >
            {linked ? (
              <p className="px-3.5 pb-1 pt-2 text-[12px] font-medium text-ink-secondary">
                Povezano: {displayKbTitle(linked.title, linked.createdAt)}
              </p>
            ) : null}
            {pages.length === 0 ? (
              <p className="px-3.5 py-3 text-[13px] text-ink-tertiary">
                Nema drugih stranica
              </p>
            ) : (
              pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  role="option"
                  aria-selected={page.id === linkedId}
                  onClick={() =>
                    applyLink(
                      page.id,
                      displayKbTitle(page.title, page.createdAt),
                    )
                  }
                  className={cn(
                    "flex min-h-11 w-full items-center px-3.5 text-left text-[15px]",
                    page.id === linkedId ? "text-accent" : "text-ink",
                  )}
                >
                  {displayKbTitle(page.title, page.createdAt)}
                </button>
              ))
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
