import { cn } from "@/lib/cn";
import { cropImageBlob } from "@/lib/media";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";

type Rect = { x: number; y: number; w: number; h: number };
type Handle = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export function ImageCropDialog({
  src,
  blob,
  open,
  onClose,
  onApply,
}: {
  src: string;
  blob: Blob;
  open: boolean;
  onClose: () => void;
  onApply: (next: Blob) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Rect | null>(null);

  useEffect(() => {
    if (!open) setCrop(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function initCrop() {
    const img = imgRef.current;
    if (!img) return;
    setCrop({
      x: img.clientWidth * 0.08,
      y: img.clientHeight * 0.08,
      w: img.clientWidth * 0.84,
      h: img.clientHeight * 0.84,
    });
  }

  function onPointerDown(handle: Handle, event: PointerEvent<HTMLElement>) {
    if (!crop) return;
    event.preventDefault();
    event.stopPropagation();
    const start = crop;
    const origin = { x: event.clientX, y: event.clientY };
    const image = imgRef.current;
    if (!image) return;
    const frame = { clientWidth: image.clientWidth, clientHeight: image.clientHeight };

    function move(ev: globalThis.PointerEvent) {
      const dx = ev.clientX - origin.x;
      const dy = ev.clientY - origin.y;
      setCrop(clampRect(resizeRect(start, handle, dx, dy), frame));
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  async function apply() {
    const img = imgRef.current;
    if (!img || !crop) return;
    const next = await cropImageBlob(
      blob,
      crop,
      { width: img.naturalWidth, height: img.naturalHeight },
      { width: img.clientWidth, height: img.clientHeight },
    );
    onApply(next);
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/80">
      <div className="flex min-h-12 items-center justify-between px-3 pt-[max(8px,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 px-3 text-[16px] text-white"
        >
          Odustani
        </button>
        <p className="text-[16px] font-semibold text-white">Kropuj</p>
        <button
          type="button"
          onClick={() => void apply()}
          className="min-h-11 px-3 text-[16px] font-semibold text-white"
        >
          Sačuvaj
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <div className="relative inline-block max-h-full max-w-full touch-none">
          <img
            ref={imgRef}
            src={src}
            alt=""
            onLoad={initCrop}
            className="max-h-[min(78dvh,720px)] max-w-full select-none rounded-lg"
          />
          {crop ? (
            <>
              <div
                className="pointer-events-none absolute left-0 right-0 top-0 bg-black/45"
                style={{ height: crop.y }}
              />
              <div
                className="pointer-events-none absolute left-0 bg-black/45"
                style={{ top: crop.y, height: crop.h, width: crop.x }}
              />
              <div
                className="pointer-events-none absolute right-0 bg-black/45"
                style={{
                  top: crop.y,
                  height: crop.h,
                  width: `calc(100% - ${crop.x + crop.w}px)`,
                }}
              />
              <div
                className="pointer-events-none absolute bottom-0 left-0 right-0 bg-black/45"
                style={{ height: `calc(100% - ${crop.y + crop.h}px)` }}
              />
              <div
                className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                style={{
                  left: crop.x,
                  top: crop.y,
                  width: crop.w,
                  height: crop.h,
                }}
                onPointerDown={(event) => onPointerDown("move", event)}
              >
                {(
                  [
                    ["nw", "left-0 top-0 -translate-x-1/2 -translate-y-1/2"],
                    ["n", "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"],
                    ["ne", "right-0 top-0 translate-x-1/2 -translate-y-1/2"],
                    ["e", "right-0 top-1/2 translate-x-1/2 -translate-y-1/2"],
                    ["se", "right-0 bottom-0 translate-x-1/2 translate-y-1/2"],
                    ["s", "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2"],
                    ["sw", "left-0 bottom-0 -translate-x-1/2 translate-y-1/2"],
                    ["w", "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2"],
                  ] as const
                ).map(([handle, place]) => (
                  <button
                    key={handle}
                    type="button"
                    aria-label="Ivica kropljenja"
                    className={cn(
                      "absolute size-4 rounded-full bg-white shadow",
                      place,
                    )}
                    onPointerDown={(event) => onPointerDown(handle, event)}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function resizeRect(start: Rect, handle: Handle, dx: number, dy: number): Rect {
  let { x, y, w, h } = start;
  if (handle === "move") return { x: x + dx, y: y + dy, w, h };
  if (handle === "e" || handle === "ne" || handle === "se") w += dx;
  if (handle === "s" || handle === "se" || handle === "sw") h += dy;
  if (handle === "w" || handle === "nw" || handle === "sw") {
    x += dx;
    w -= dx;
  }
  if (handle === "n" || handle === "ne" || handle === "nw") {
    y += dy;
    h -= dy;
  }
  return { x, y, w, h };
}

function clampRect(
  rect: Rect,
  box: { clientWidth: number; clientHeight: number },
): Rect {
  const min = 40;
  const maxW = box.clientWidth;
  const maxH = box.clientHeight;
  let { x, y, w, h } = rect;
  w = Math.min(maxW, Math.max(min, w));
  h = Math.min(maxH, Math.max(min, h));
  x = Math.min(maxW - w, Math.max(0, x));
  y = Math.min(maxH - h, Math.max(0, y));
  return { x, y, w, h };
}
