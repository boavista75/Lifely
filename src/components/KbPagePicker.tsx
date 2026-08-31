import { IconClose } from "@/components/icons";
import { displayKbTitle, isKbPage } from "@/lib/kb";
import { useKbStore } from "@/store/useKbStore";
import { useEffect, useRef, useState } from "react";

type Props = {
  value: string | null;
  onChange: (pageId: string | null) => void;
};

export function KbPagePicker({ value, onChange }: Props) {
  const nodes = useKbStore((state) => state.nodes);
  const pages = nodes
    .filter(isKbPage)
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title, "sr-Latn"));
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = pages.find((page) => page.id === value) ?? null;

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  return (
    <div ref={rootRef} className="relative mb-4">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-secondary">
        Knowledge
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen((current) => !current)}
          className="flex h-12 min-w-0 flex-1 items-center justify-between rounded-2xl bg-surface-2 px-3.5 text-left text-[16px] transition-shadow duration-200"
        >
          <span className="truncate text-ink">
            {selected
              ? displayKbTitle(selected.title, selected.createdAt)
              : ""}
          </span>
          <span className="text-ink-tertiary">▾</span>
        </button>
        <button
          type="button"
          aria-label="Ukini vezu sa stranicom"
          disabled={!value}
          onClick={() => {
            onChange(null);
            setOpen(false);
          }}
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-ink-secondary transition-colors duration-200 hover:text-danger disabled:text-ink-tertiary disabled:opacity-40"
        >
          <IconClose className="size-5" />
        </button>
      </div>
      {open && (
        <div
          role="listbox"
          className="glass absolute z-30 mt-1 max-h-64 w-[calc(100%-56px)] overflow-y-auto overscroll-contain rounded-2xl shadow-[var(--shadow-float)]"
        >
          {pages.length === 0 ? (
            <p className="px-3.5 py-3 text-[13px] text-ink-tertiary">
              Nema stranica
            </p>
          ) : (
            pages.map((page) => (
              <button
                key={page.id}
                type="button"
                role="option"
                aria-selected={page.id === value}
                onClick={() => {
                  onChange(page.id);
                  setOpen(false);
                }}
                className="flex min-h-11 w-full items-center px-3.5 text-left text-[15px]"
              >
                {displayKbTitle(page.title, page.createdAt)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
