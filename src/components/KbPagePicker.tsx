import { IconClose, IconFolder, IconKnowledge } from "@/components/icons";
import { cn } from "@/lib/cn";
import { displayKbTitle, kbFolderPathLabel } from "@/lib/kb";
import { useKbStore } from "@/store/useKbStore";
import type { LifelyKbFile, LifelyKbNode, LifelyKbPage } from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  value: string | null;
  onChange: (pageId: string | null) => void;
};

type PickerDoc = LifelyKbPage | LifelyKbFile;

type PanelPos = {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
};

function isPickerDoc(node: LifelyKbNode): node is PickerDoc {
  return node.kind === "page" || node.kind === "file";
}

function positionPanel(trigger: HTMLElement): PanelPos {
  const rect = trigger.getBoundingClientRect();
  const gap = 6;
  const pad = 12;
  const width = rect.width;
  const left = Math.max(
    pad,
    Math.min(rect.left, window.innerWidth - width - pad),
  );
  const spaceBelow = window.innerHeight - rect.bottom - pad;
  const spaceAbove = rect.top - pad;
  const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
  if (openUp) {
    return {
      left,
      width,
      maxHeight: Math.min(320, Math.max(140, spaceAbove - gap)),
      bottom: window.innerHeight - rect.top + gap,
    };
  }
  return {
    left,
    width,
    maxHeight: Math.min(320, Math.max(140, spaceBelow - gap)),
    top: rect.bottom + gap,
  };
}

export function KbPagePicker({ value, onChange }: Props) {
  const nodes = useKbStore((state) => state.nodes);
  const groups = useMemo(() => {
    const docs = nodes.filter(isPickerDoc);
    const byPath = new Map<string, PickerDoc[]>();
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
  }, [nodes]);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selected =
    nodes.find((node) => node.id === value && isPickerDoc(node)) ?? null;
  const selectedPath = selected
    ? kbFolderPathLabel(nodes, selected.parentId)
    : "";
  const docCount = groups.reduce((sum, [, docs]) => sum + docs.length, 0);

  function closeList() {
    setOpen(false);
    setPos(null);
  }

  function openList() {
    if (triggerRef.current) setPos(positionPanel(triggerRef.current));
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      closeList();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      closeList();
    }
    function onReposition() {
      if (!triggerRef.current) return;
      setPos(positionPanel(triggerRef.current));
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative mb-4">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-secondary">
        Knowledge
      </span>
      <div className="flex gap-2">
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => (open ? closeList() : openList())}
          className="flex min-h-12 min-w-0 flex-1 items-center justify-between rounded-2xl bg-surface-2 px-3.5 py-1.5 text-left transition-shadow duration-200"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[16px] text-ink">
              {selected
                ? displayKbTitle(selected.title, selected.createdAt)
                : ""}
            </span>
            {selectedPath ? (
              <span className="block truncate text-[11px] text-ink-tertiary">
                {selectedPath}
              </span>
            ) : null}
          </span>
          <span className="text-ink-tertiary">▾</span>
        </button>
        <button
          type="button"
          aria-label="Ukini vezu sa stranicom"
          disabled={!value}
          onClick={() => {
            onChange(null);
            closeList();
          }}
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-ink-secondary transition-colors duration-200 hover:text-danger disabled:text-ink-tertiary disabled:opacity-40"
        >
          <IconClose className="size-5" />
        </button>
      </div>
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            aria-label="Knowledge dokumenti"
            className="fixed z-[65] overflow-y-auto overscroll-contain rounded-2xl bg-surface py-1.5 shadow-[var(--shadow-float)] ring-1 ring-ink/18"
            style={{
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
              top: pos.top,
              bottom: pos.bottom,
            }}
          >
            {docCount === 0 ? (
              <p className="px-3.5 py-3 text-[13px] text-ink-tertiary">
                Nema stranica
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
                  {docs.map((doc) => {
                    const active = doc.id === value;
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          onChange(doc.id);
                          closeList();
                        }}
                        className={cn(
                          "flex min-h-10 w-full items-center px-3.5 pl-8 text-left text-[15px]",
                          active
                            ? "bg-accent/10 font-medium text-accent"
                            : "text-ink hover:bg-ink/[0.055]",
                        )}
                      >
                        <span className="truncate">
                          {displayKbTitle(doc.title, doc.createdAt)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
