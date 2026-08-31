import { cn } from "@/lib/cn";
import {
  clamp,
  hexToHsv,
  hsvToHex,
  parseColor,
  type Hsv,
} from "@/lib/color";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";

const PANEL_W = 248;
const DEFAULT_HSV: Hsv = { h: 174, s: 0.72, v: 0.42 };

type Props = {
  open: boolean;
  onClose: () => void;
  anchor: HTMLElement | null;
  value?: string;
  onChange: (color: string | null) => void;
  label: string;
};

export function NoteColorPicker({
  open,
  onClose,
  anchor,
  value,
  onChange,
  label,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const hsvRef = useRef<Hsv>(DEFAULT_HSV);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [hsv, setHsv] = useState<Hsv>(DEFAULT_HSV);
  const [hexDraft, setHexDraft] = useState("");
  const valueRef = useRef(value);
  valueRef.current = value;
  hsvRef.current = hsv;

  useLayoutEffect(() => {
    if (!open) return;
    const parsed = parseColor(valueRef.current);
    const next = parsed ? hexToHsv(parsed) ?? DEFAULT_HSV : DEFAULT_HSV;
    hsvRef.current = next;
    setHsv(next);
    setHexDraft(hsvToHex(next).slice(1));
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !anchor) return;

    function place() {
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const panelH = panelRef.current?.offsetHeight ?? 280;
      const pad = 12;
      let left = rect.left + rect.width / 2 - PANEL_W / 2;
      left = clamp(left, pad, window.innerWidth - PANEL_W - pad);
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
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
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
  }, [open, anchor, onClose]);

  function commit(next: Hsv) {
    hsvRef.current = next;
    setHsv(next);
    const hex = hsvToHex(next);
    setHexDraft(hex.slice(1));
    onChangeRef.current(hex);
  }

  function onSvPointer(event: ReactPointerEvent<HTMLDivElement>) {
    trackPointer(event, (clientX, clientY, el) => {
      const rect = el.getBoundingClientRect();
      commit({
        ...hsvRef.current,
        s: clamp((clientX - rect.left) / rect.width, 0, 1),
        v: clamp(1 - (clientY - rect.top) / rect.height, 0, 1),
      });
    });
  }

  function onHuePointer(event: ReactPointerEvent<HTMLDivElement>) {
    trackPointer(event, (clientX, _clientY, el) => {
      const rect = el.getBoundingClientRect();
      commit({
        ...hsvRef.current,
        h: clamp(((clientX - rect.left) / rect.width) * 360, 0, 360),
      });
    });
  }

  function applyHexDraft() {
    const parsed = parseColor(`#${hexDraft}`);
    if (!parsed) {
      setHexDraft(hsvToHex(hsv).slice(1));
      return;
    }
    const next = hexToHsv(parsed);
    if (next) commit(next);
  }

  if (!open) return null;

  const hex = hsvToHex(hsv);
  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 });

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={label}
      onMouseDown={(event) => {
        const tag = (event.target as HTMLElement).tagName;
        if (tag === "INPUT") return;
        event.preventDefault();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className="glass fixed z-[55] select-none rounded-[22px] p-3 shadow-[var(--shadow-float)]"
      style={{ top: pos.top, left: pos.left, width: PANEL_W }}
    >
      <div
        role="slider"
        aria-label="Zasićenje i svetlost"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.s * 100)}
        className="relative h-36 touch-none overflow-hidden rounded-xl"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`,
        }}
        onPointerDown={onSvPointer}
      >
        <div
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.28)]"
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            background: hex,
          }}
        />
      </div>
      <div
        role="slider"
        aria-label="Nijansa"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
        className="relative mt-3 h-6 touch-none rounded-full"
        style={{
          background:
            "linear-gradient(to right, #f00 0%, #ff0 16.6%, #0f0 33.3%, #0ff 50%, #00f 66.6%, #f0f 83.3%, #f00 100%)",
        }}
        onPointerDown={onHuePointer}
      >
        <div
          className="pointer-events-none absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
          style={{ left: `${(hsv.h / 360) * 100}%`, background: hueColor }}
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div
          aria-hidden
          className="size-8 shrink-0 rounded-lg border border-ink/10"
          style={{ background: hex }}
        />
        <div className="flex min-w-0 flex-1 items-center rounded-lg bg-surface-2 px-2">
          <span className="text-[13px] text-ink-tertiary">#</span>
          <input
            value={hexDraft}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Hex boja"
            onMouseDown={(event) => event.stopPropagation()}
            onChange={(event) => {
              const next = event.target.value
                .replace(/[^0-9a-fA-F]/g, "")
                .slice(0, 6);
              setHexDraft(next);
              if (next.length !== 6) return;
              const parsed = parseColor(`#${next}`);
              const hsvNext = parsed ? hexToHsv(parsed) : null;
              if (hsvNext) commit(hsvNext);
            }}
            onBlur={applyHexDraft}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyHexDraft();
              }
            }}
            className="min-w-0 flex-1 select-text bg-transparent py-2 pl-0.5 text-[13px] uppercase tracking-wide outline-none"
          />
        </div>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setHexDraft("");
            onChange(null);
            onClose();
          }}
          className={cn(
            "shrink-0 rounded-lg px-2 py-2 text-[13px] font-medium",
            value ? "text-danger" : "text-ink-tertiary",
          )}
        >
          Ukloni
        </button>
      </div>
    </div>,
    document.body,
  );
}

function trackPointer(
  event: ReactPointerEvent<HTMLElement>,
  onMove: (clientX: number, clientY: number, el: HTMLElement) => void,
) {
  event.preventDefault();
  const el = event.currentTarget;
  el.setPointerCapture(event.pointerId);
  const move = (next: PointerEvent) => onMove(next.clientX, next.clientY, el);
  move(event.nativeEvent);
  const stop = () => {
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", stop);
    el.removeEventListener("pointercancel", stop);
  };
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", stop);
  el.addEventListener("pointercancel", stop);
}
