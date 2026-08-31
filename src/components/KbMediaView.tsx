import { ImageCropDialog } from "@/components/ImageCropDialog";
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconClose,
  IconCrop,
} from "@/components/icons";
import { cn } from "@/lib/cn";
import {
  loadMedia,
  saveMedia,
  type MediaAlign,
  type MediaKind,
} from "@/lib/media";
import type { ReactNodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

export function KbImageView(props: ReactNodeViewProps) {
  return <KbMediaFrame kind="image" {...props} />;
}

export function KbVideoView(props: ReactNodeViewProps) {
  return <KbMediaFrame kind="video" {...props} />;
}

function KbMediaFrame({
  kind,
  node,
  selected,
  updateAttributes,
  deleteNode,
  editor,
  getPos,
}: ReactNodeViewProps & { kind: MediaKind }) {
  const mediaId = String(node.attrs.mediaId ?? "");
  const width = clampWidth(Number(node.attrs.width) || 100);
  const align = readAlign(node.attrs.align);
  const [src, setSrc] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mediaId) return;
    let url: string | null = null;
    let cancelled = false;
    void loadMedia(mediaId).then((file) => {
      if (cancelled || !file) return;
      url = URL.createObjectURL(file);
      setBlob(file);
      setSrc(url);
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [mediaId]);

  function select() {
    const pos = getPos();
    if (typeof pos === "number") editor.chain().setNodeSelection(pos).run();
  }

  function setAlign(next: MediaAlign) {
    updateAttributes({ align: next });
  }

  function onResizePointerDown(edge: "left" | "right", event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startWidth = width;
    const parent = frameRef.current?.parentElement;
    const container = parent?.clientWidth || 1;
    const factor =
      align === "center" ? 2 : align === "right" ? (edge === "left" ? 1 : -1) : 1;

    function move(ev: globalThis.PointerEvent) {
      const dx = ev.clientX - startX;
      const delta = (dx / container) * 100 * (edge === "left" ? -factor : factor);
      updateAttributes({ width: clampWidth(startWidth + delta) });
    }
    function up() {
      handle.releasePointerCapture(event.pointerId);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  async function applyCrop(next: Blob) {
    const id = await saveMedia(next);
    updateAttributes({ mediaId: id });
    setCropOpen(false);
  }

  return (
    <NodeViewWrapper
      className="kb-media-node my-3"
      data-align={align}
      onClick={select}
    >
      <div
        ref={frameRef}
        className={cn(
          "relative max-w-full",
          align === "left" && "mr-auto",
          align === "center" && "mx-auto",
          align === "right" && "ml-auto",
        )}
        style={{ width: `${width}%` }}
      >
        {selected ? (
          <div
            data-media-ui
            className="absolute left-1/2 top-2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-2xl bg-surface p-0.5 shadow-[var(--shadow-float)]"
          >
            <MediaTool
              label="Levo"
              active={align === "left"}
              onClick={() => setAlign("left")}
            >
              <IconAlignLeft className="size-4" />
            </MediaTool>
            <MediaTool
              label="Centar"
              active={align === "center"}
              onClick={() => setAlign("center")}
            >
              <IconAlignCenter className="size-4" />
            </MediaTool>
            <MediaTool
              label="Desno"
              active={align === "right"}
              onClick={() => setAlign("right")}
            >
              <IconAlignRight className="size-4" />
            </MediaTool>
            {kind === "image" ? (
              <MediaTool label="Kropuj" onClick={() => setCropOpen(true)}>
                <IconCrop className="size-4" />
              </MediaTool>
            ) : null}
            <MediaTool label="Ukloni" onClick={deleteNode}>
              <IconClose className="size-4" />
            </MediaTool>
          </div>
        ) : null}
        {src ? (
          kind === "image" ? (
            <img
              src={src}
              alt=""
              className={cn(
                "block w-full rounded-xl bg-surface-2",
                selected && "ring-2 ring-accent",
              )}
            />
          ) : (
            <video
              src={src}
              controls
              className={cn(
                "block w-full rounded-xl bg-surface-2",
                selected && "ring-2 ring-accent",
              )}
            />
          )
        ) : (
          <div className="grid h-32 place-items-center rounded-xl bg-surface-2 text-[13px] text-ink-tertiary">
            Učitavanje…
          </div>
        )}
        {selected ? (
          <>
            <ResizeHandle
              side="left"
              hidden={align === "left"}
              onPointerDown={(event) => onResizePointerDown("left", event)}
            />
            <ResizeHandle
              side="right"
              hidden={align === "right"}
              onPointerDown={(event) => onResizePointerDown("right", event)}
            />
          </>
        ) : null}
      </div>
      {kind === "image" && src && blob ? (
        <ImageCropDialog
          src={src}
          blob={blob}
          open={cropOpen}
          onClose={() => setCropOpen(false)}
          onApply={(next) => void applyCrop(next)}
        />
      ) : null}
    </NodeViewWrapper>
  );
}

function MediaTool({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      data-media-ui
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "grid size-9 place-items-center rounded-lg",
        active ? "bg-accent/12 text-accent" : "text-ink-secondary",
      )}
    >
      {children}
    </button>
  );
}

function ResizeHandle({
  side,
  hidden,
  onPointerDown,
}: {
  side: "left" | "right";
  hidden?: boolean;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
}) {
  if (hidden) return null;
  return (
    <button
      type="button"
      aria-label="Promeni veličinu"
      data-media-ui
      onPointerDown={onPointerDown}
      className={cn(
        "absolute top-1/2 z-10 size-7 -translate-y-1/2 touch-none",
        side === "left" ? "-left-2" : "-right-2",
      )}
    >
      <span className="mx-auto block h-10 w-1.5 rounded-full bg-accent shadow" />
    </button>
  );
}

function clampWidth(value: number): number {
  return Math.min(100, Math.max(20, Math.round(value)));
}

function readAlign(value: unknown): MediaAlign {
  if (value === "left" || value === "right") return value;
  return "center";
}
