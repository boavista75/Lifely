import { NoteColorPicker } from "@/components/NoteColorPicker";
import { cn } from "@/lib/cn";
import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export function RichEditorToolbar({
  editor,
  extra,
}: {
  editor: Editor;
  extra?: ReactNode;
}) {
  return (
    <div className="shrink-0 px-3 pb-2 md:px-6">
      <div className="flex gap-0.5 overflow-x-auto no-scrollbar rounded-2xl bg-surface-2/90 p-1">
        <ToolButton
          label="Naslov 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          H1
        </ToolButton>
        <ToolButton
          label="Naslov 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </ToolButton>
        <ToolButton
          label="Naslov 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          H3
        </ToolButton>
        <ToolButton
          label="Podebljano"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <span className="font-bold">B</span>
        </ToolButton>
        <ToolButton
          label="Kurziv"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <span className="italic">I</span>
        </ToolButton>
        <ToolButton
          label="Podvučeno"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="underline">U</span>
        </ToolButton>
        <ColorMenu
          editor={editor}
          label="Boja teksta"
          kind="text"
          current={editor.getAttributes("textStyle").color as string | undefined}
        />
        <ColorMenu
          editor={editor}
          label="Pozadina teksta"
          kind="highlight"
          current={
            editor.getAttributes("highlight").color as string | undefined
          }
        />
        <ToolButton
          label="Lista sa tačkama"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
            <circle cx="3" cy="4" r="1.15" fill="currentColor" />
            <circle cx="3" cy="8" r="1.15" fill="currentColor" />
            <circle cx="3" cy="12" r="1.15" fill="currentColor" />
            <path
              d="M6.5 4h7M6.5 8h7M6.5 12h7"
              stroke="currentColor"
              strokeWidth="1.4"
              fill="none"
            />
          </svg>
        </ToolButton>
        <ToolButton
          label="Numerisana lista"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <span className="text-[12px] tracking-tight">1.</span>
        </ToolButton>
        {extra}
      </div>
    </div>
  );
}

export function ToolButton({
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
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "grid h-11 min-w-11 shrink-0 place-items-center rounded-lg px-2 text-[13px] font-semibold",
        active ? "bg-surface text-accent shadow-sm" : "text-ink-secondary",
      )}
    >
      {children}
    </button>
  );
}

function ColorMenu({
  editor,
  label,
  current,
  kind,
}: {
  editor: Editor;
  label: string;
  current?: string;
  kind: "text" | "highlight";
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectionRef = useRef({ from: 0, to: 0 });

  const close = useCallback(() => {
    setOpen(false);
    editor.chain().focus().run();
  }, [editor]);

  useEffect(() => {
    function onCloseOthers() {
      setOpen(false);
    }
    window.addEventListener("lifely-close-color-picker", onCloseOthers);
    return () =>
      window.removeEventListener("lifely-close-color-picker", onCloseOthers);
  }, []);

  function toggle() {
    if (open) {
      close();
      return;
    }
    window.dispatchEvent(new Event("lifely-close-color-picker"));
    const { from, to } = editor.state.selection;
    selectionRef.current = { from, to };
    setOpen(true);
  }

  function applyColor(color: string | null) {
    const { from, to } = selectionRef.current;
    const chain = editor.chain().setTextSelection({ from, to });
    if (kind === "text") {
      if (color) chain.setColor(color).run();
      else chain.unsetColor().run();
    } else if (color) {
      chain.setHighlight({ color }).run();
    } else {
      chain.unsetHighlight().run();
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-pressed={open || Boolean(current)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={toggle}
        className={cn(
          "grid h-11 min-w-11 shrink-0 place-items-center rounded-lg px-2 text-[13px] font-semibold",
          open ? "bg-surface text-accent shadow-sm" : "text-ink-secondary",
        )}
      >
        {kind === "text" ? (
          <span
            className="border-b-2 px-0.5 font-bold"
            style={{ borderColor: current || "currentColor" }}
          >
            A
          </span>
        ) : (
          <span
            className="rounded-sm px-1 py-0.5 text-[12px] font-bold"
            style={{
              background:
                current ||
                "color-mix(in srgb, var(--ink) 12%, transparent)",
            }}
          >
            A
          </span>
        )}
      </button>
      <NoteColorPicker
        open={open}
        onClose={close}
        anchor={buttonRef.current}
        value={current}
        onChange={applyColor}
        label={label}
      />
    </>
  );
}
