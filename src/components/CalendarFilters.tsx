import { IconFilter } from "@/components/icons";
import { text } from "@/i18n";
import { SportCheck } from "@/components/SportCheck";
import { cn } from "@/lib/cn";
import { useUiStore } from "@/store/useUiStore";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

const PANEL_W = 320;

export function CalendarFilters() {
  const showSport = useUiStore((state) => state.showSport);
  const setShowSport = useUiStore((state) => state.setShowSport);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const panelId = useId();

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={showSport ? text("calendar.filtersSport") : text("calendar.filters")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "pressable inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold",
          open || showSport
            ? "bg-accent/12 text-accent"
            : "bg-surface-2 text-ink",
        )}
      >
        <IconFilter className="size-[18px]" />
        {text("calendar.filters")}
        {showSport ? (
          <span
            className="grid size-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-fg"
            aria-hidden
          >
            1
          </span>
        ) : null}
      </button>
      <FiltersPanel
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={buttonRef}
        titleId={titleId}
        panelId={panelId}
        showSport={showSport}
        setShowSport={setShowSport}
      />
    </>
  );
}

function FiltersPanel({
  open,
  onClose,
  anchorRef,
  titleId,
  panelId,
  showSport,
  setShowSport,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
  titleId: string;
  panelId: string;
  showSport: boolean;
  setShowSport: (show: boolean) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open) return;

    function place() {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const panelH = panelRef.current?.offsetHeight ?? 220;
      const pad = 12;
      const width = Math.min(PANEL_W, window.innerWidth - pad * 2);
      let left = rect.right - width;
      left = Math.min(Math.max(left, pad), window.innerWidth - width - pad);
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

  const width = Math.min(PANEL_W, typeof window === "undefined" ? PANEL_W : window.innerWidth - 24);

  return createPortal(
    <div
      ref={panelRef}
      id={panelId}
      role="dialog"
      aria-labelledby={titleId}
      className="glass fixed z-[55] overflow-hidden rounded-[22px] p-3 shadow-[var(--shadow-float)]"
      style={{ top: pos.top, left: pos.left, width }}
    >
      <div className="px-1.5 pb-3 pt-0.5">
        <p
          id={titleId}
          className="font-display text-[18px] font-semibold tracking-[-0.02em]"
        >
          {text("calendar.filters")}
        </p>
        <p className="mt-1 text-[13px] leading-snug text-ink-secondary">
          {text("calendar.filtersHint")}
        </p>
      </div>
      <SportCheck
        checked={showSport}
        onChange={setShowSport}
        label={text("calendar.showSport")}
      />
    </div>,
    document.body,
  );
}
