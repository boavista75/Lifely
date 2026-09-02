import { IconCheck } from "@/components/icons";
import { cn } from "@/lib/cn";
import { PALETTES, type Palette } from "@/lib/palettes";
import { useThemeStore } from "@/store/useThemeStore";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

const PANEL_W = 280;

export function AppearanceButton() {
  const paletteId = useThemeStore((state) => state.palette);
  const setPalette = useThemeStore((state) => state.setPalette);
  const palette = PALETTES.find((item) => item.id === paletteId) ?? PALETTES[0];
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Izgled"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2"
      >
        <PaletteStrip palette={palette} className="h-5 w-8 rounded-full" />
      </button>
      <AppearancePanel
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={buttonRef}
        selectedId={palette.id}
        onSelect={setPalette}
      />
    </>
  );
}

function AppearancePanel({
  open,
  onClose,
  anchorRef,
  selectedId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
  selectedId: string;
  onSelect: (id: Palette["id"]) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current;
    if (!anchor) return;

    function place() {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const panelH = panelRef.current?.offsetHeight ?? 420;
      const pad = 12;
      let left = rect.right - PANEL_W;
      left = Math.min(Math.max(left, pad), window.innerWidth - PANEL_W - pad);
      let top = rect.bottom + 8;
      if (top + panelH > window.innerHeight - pad) {
        top = Math.max(pad, rect.top - panelH - 8);
      }
      setPos({ top, left });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const anchor = anchorRef.current;
      if (panelRef.current?.contains(target) || anchor?.contains(target)) {
        return;
      }
      onClose();
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, anchorRef, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Izgled"
      className="glass fixed z-[55] max-h-[min(92dvh,560px)] overflow-y-auto rounded-[22px] p-3 shadow-[var(--shadow-float)]"
      style={{ top: pos.top, left: pos.left, width: PANEL_W }}
    >
      <p className="px-1 pb-2 text-[13px] font-medium text-ink-secondary">
        Paleta boja
      </p>
      <div role="radiogroup" aria-label="Paleta boja" className="flex flex-col gap-1">
        {PALETTES.map((palette) => {
          const selected = palette.id === selectedId;
          return (
            <button
              key={palette.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(palette.id)}
              className={cn(
                "rounded-[18px] p-2 text-left transition-colors duration-150",
                selected ? "bg-accent/12" : "hover:bg-ink/5",
              )}
            >
              <PaletteStrip
                palette={palette}
                className={cn(
                  "h-12 rounded-[14px]",
                  selected && "ring-2 ring-accent ring-offset-2 ring-offset-surface",
                )}
              />
              <span className="mt-2 flex min-h-6 items-center justify-between gap-2 px-0.5">
                <span className="text-[14px] font-medium text-ink">
                  {palette.name}
                </span>
                <span className="flex items-center gap-2">
                  <span className="flex gap-1" aria-hidden>
                    <span
                      className="size-3.5 rounded-[5px] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]"
                      style={{ background: palette.mint }}
                    />
                    <span
                      className="size-3.5 rounded-[5px] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]"
                      style={{ background: palette.navy }}
                    />
                  </span>
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full",
                      selected
                        ? "bg-accent text-accent-fg"
                        : "text-transparent",
                    )}
                  >
                    <IconCheck className="size-3" />
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}

function PaletteStrip({
  palette,
  className,
}: {
  palette: Palette;
  className?: string;
}) {
  return (
    <span
      className={cn("flex overflow-hidden", className)}
      aria-hidden
    >
      {palette.swatches.map((color) => (
        <span
          key={color}
          className="h-full min-w-0 flex-1"
          style={{ background: color }}
        />
      ))}
    </span>
  );
}
