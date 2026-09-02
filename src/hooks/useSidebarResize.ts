import { cn } from "@/lib/cn";
import {
  clampSidebarWidth,
  SIDEBAR_WIDTH_DEFAULT,
  SIDEBAR_WIDTH_MIN,
  SIDEBAR_WIDTH_STEP,
  sidebarWidthMax,
} from "@/lib/sidebar";
import { loadSidebarWidth, saveSidebarWidth } from "@/lib/storage";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

type DragSession = {
  pointerId: number;
  startX: number;
  startWidth: number;
};

function setDraggingUi(handle: HTMLDivElement | null, active: boolean) {
  if (handle) handle.dataset.resizing = active ? "true" : "false";
  document.body.classList.toggle("sidebar-resizing", active);
}

export function useSidebarResize() {
  const [width, setWidth] = useState(loadSidebarWidth);
  const asideRef = useRef<HTMLElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(width);
  const dragRef = useRef<DragSession | null>(null);

  const commit = useCallback((next: number, persist: boolean) => {
    const clamped = clampSidebarWidth(next);
    widthRef.current = clamped;
    const aside = asideRef.current;
    if (aside) aside.style.width = `${clamped}px`;
    const handle = handleRef.current;
    if (handle) {
      handle.setAttribute("aria-valuenow", String(clamped));
      handle.setAttribute("aria-valuemax", String(sidebarWidthMax()));
    }
    if (persist) {
      setWidth(clamped);
      saveSidebarWidth(clamped);
    }
  }, []);

  useEffect(() => {
    function onWindowResize() {
      if (dragRef.current) return;
      commit(widthRef.current, true);
    }
    window.addEventListener("resize", onWindowResize);
    return () => window.removeEventListener("resize", onWindowResize);
  }, [commit]);

  useEffect(() => {
    return () => setDraggingUi(null, false);
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startWidth: widthRef.current,
      };
      setDraggingUi(event.currentTarget, true);
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      event.preventDefault();
      commit(drag.startWidth + (event.clientX - drag.startX), false);
    },
    [commit],
  );

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      setDraggingUi(event.currentTarget, false);
      commit(widthRef.current, true);
    },
    [commit],
  );

  const onDoubleClick = useCallback(() => {
    commit(SIDEBAR_WIDTH_DEFAULT, true);
  }, [commit]);

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const max = sidebarWidthMax();
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        commit(widthRef.current - SIDEBAR_WIDTH_STEP, true);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        commit(widthRef.current + SIDEBAR_WIDTH_STEP, true);
      } else if (event.key === "Home") {
        event.preventDefault();
        commit(SIDEBAR_WIDTH_MIN, true);
      } else if (event.key === "End") {
        event.preventDefault();
        commit(max, true);
      }
    },
    [commit],
  );

  return {
    asideRef,
    width,
    handleProps: {
      ref: handleRef,
      role: "separator" as const,
      "aria-orientation": "vertical" as const,
      "aria-label": "Širina panela",
      "aria-valuemin": SIDEBAR_WIDTH_MIN,
      "aria-valuemax": sidebarWidthMax(),
      "aria-valuenow": width,
      tabIndex: 0,
      title: "Prevuci da promeniš širinu. Dvoklik vraća podrazumevanu.",
      className: cn(
        "group absolute inset-y-0 right-0 z-20 flex w-3 cursor-col-resize touch-none items-stretch justify-center",
        "outline-none focus-visible:shadow-[inset_-2px_0_0_0_var(--accent)]",
      ),
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onDoubleClick,
      onKeyDown,
    },
  };
}
