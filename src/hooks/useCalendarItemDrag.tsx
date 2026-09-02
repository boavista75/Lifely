import { cn } from "@/lib/cn";
import { formatItemTime } from "@/lib/items";
import { useItemsStore } from "@/store/useItemsStore";
import type { LifelyItem } from "@/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const CALENDAR_DAY_ATTR = "data-calendar-day";

type DragVisual = {
  itemId: string;
  title: string;
  time: string | null;
  completed: boolean;
  x: number;
  y: number;
  overDate: string | null;
};

type Session = {
  item: LifelyItem;
  pointerId: number;
  startX: number;
  startY: number;
  active: boolean;
  holdTimer: number | null;
};

type CalendarDragApi = {
  draggingId: string | null;
  overDate: string | null;
  onItemPointerDown: (
    item: LifelyItem,
    event: ReactPointerEvent,
    options?: { immediate?: boolean },
  ) => void;
  consumeDragClick: () => boolean;
};

const CalendarDragContext = createContext<CalendarDragApi | null>(null);

const MOVE_THRESHOLD_PX = 8;
const TOUCH_HOLD_MS = 200;
const SCROLL_CANCEL_PX = 10;

function dateFromPoint(x: number, y: number): string | null {
  const node = document.elementFromPoint(x, y);
  if (!(node instanceof Element)) return null;
  const day = node.closest(`[${CALENDAR_DAY_ATTR}]`);
  return day instanceof HTMLElement
    ? (day.getAttribute(CALENDAR_DAY_ATTR) ?? null)
    : null;
}

function suppressNextClick() {
  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    document.removeEventListener("click", onClick, true);
  };
  document.addEventListener("click", onClick, true);
  window.setTimeout(() => {
    document.removeEventListener("click", onClick, true);
  }, 500);
}

export function CalendarDragProvider({ children }: { children: ReactNode }) {
  const updateItem = useItemsStore((state) => state.updateItem);
  const [visual, setVisual] = useState<DragVisual | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const draggedRef = useRef(false);
  const detachRef = useRef<(() => void) | null>(null);

  const endDrag = useCallback(() => {
    const session = sessionRef.current;
    if (session?.holdTimer != null) window.clearTimeout(session.holdTimer);
    sessionRef.current = null;
    document.body.classList.remove("calendar-item-dragging");
    setVisual(null);
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      detachRef.current?.();
      document.body.classList.remove("calendar-item-dragging");
    };
  }, []);

  const onItemPointerDown = useCallback(
    (
      item: LifelyItem,
      event: ReactPointerEvent,
      options?: { immediate?: boolean },
    ) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("[data-no-calendar-drag]")
      ) {
        return;
      }

      event.stopPropagation();
      const pointerId = event.pointerId;
      const startX = event.clientX;
      const startY = event.clientY;
      const holdToDrag = event.pointerType === "touch" && !options?.immediate;

      if (sessionRef.current?.holdTimer != null) {
        window.clearTimeout(sessionRef.current.holdTimer);
      }

      const session: Session = {
        item,
        pointerId,
        startX,
        startY,
        active: false,
        holdTimer: null,
      };
      sessionRef.current = session;

      function pickup(x: number, y: number) {
        const current = sessionRef.current;
        if (!current || current.active) return;
        current.active = true;
        document.body.classList.add("calendar-item-dragging");
        setVisual({
          itemId: current.item.id,
          title: current.item.title,
          time: formatItemTime(current.item),
          completed: current.item.completed,
          x,
          y,
          overDate: dateFromPoint(x, y),
        });
      }

      if (holdToDrag) {
        session.holdTimer = window.setTimeout(
          () => pickup(startX, startY),
          TOUCH_HOLD_MS,
        );
      }

      function onMove(moveEvent: PointerEvent) {
        if (moveEvent.pointerId !== pointerId) return;
        const current = sessionRef.current;
        if (!current) return;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        const distance = Math.hypot(dx, dy);

        if (!current.active) {
          if (holdToDrag) {
            if (distance > SCROLL_CANCEL_PX && current.holdTimer != null) {
              window.clearTimeout(current.holdTimer);
              current.holdTimer = null;
            }
            return;
          }
          if (distance > MOVE_THRESHOLD_PX) {
            pickup(moveEvent.clientX, moveEvent.clientY);
          }
          return;
        }

        moveEvent.preventDefault();
        setVisual((prev) =>
          prev
            ? {
                ...prev,
                x: moveEvent.clientX,
                y: moveEvent.clientY,
                overDate: dateFromPoint(moveEvent.clientX, moveEvent.clientY),
              }
            : prev,
        );
      }

      function onUp(upEvent: PointerEvent) {
        if (upEvent.pointerId !== pointerId) return;
        const current = sessionRef.current;
        const active = Boolean(current?.active);
        const overDate = active
          ? dateFromPoint(upEvent.clientX, upEvent.clientY)
          : null;
        if (active && overDate && current && overDate !== current.item.date) {
          updateItem(current.item.id, { date: overDate });
        }
        if (active) {
          draggedRef.current = true;
          suppressNextClick();
        }
        cleanup();
      }

      function cleanup() {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        detachRef.current = null;
        endDrag();
      }

      detachRef.current = cleanup;
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [endDrag, updateItem],
  );

  const consumeDragClick = useCallback(() => {
    if (!draggedRef.current) return false;
    draggedRef.current = false;
    return true;
  }, []);

  const api = useMemo<CalendarDragApi>(
    () => ({
      draggingId: visual?.itemId ?? null,
      overDate: visual?.overDate ?? null,
      onItemPointerDown,
      consumeDragClick,
    }),
    [consumeDragClick, onItemPointerDown, visual?.itemId, visual?.overDate],
  );

  return (
    <CalendarDragContext.Provider value={api}>
      {children}
      {visual
        ? createPortal(
            <div
              aria-hidden
              className="pointer-events-none fixed z-[80] max-w-[220px] -translate-x-1/2 -translate-y-1/2"
              style={{ left: visual.x, top: visual.y }}
            >
              <div
                className={cn(
                  "rounded-xl px-3 py-2 shadow-[var(--shadow-float)]",
                  visual.completed
                    ? "bg-surface text-ink-tertiary line-through"
                    : "bg-accent text-accent-fg",
                )}
              >
                {visual.time && (
                  <p className="text-[11px] tabular leading-none opacity-80">
                    {visual.time}
                  </p>
                )}
                <p className="truncate text-[13px] font-medium leading-4">
                  {visual.title}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </CalendarDragContext.Provider>
  );
}

export function useCalendarDrag(): CalendarDragApi {
  const value = useContext(CalendarDragContext);
  if (!value) {
    throw new Error("useCalendarDrag must be used within CalendarDragProvider");
  }
  return value;
}
